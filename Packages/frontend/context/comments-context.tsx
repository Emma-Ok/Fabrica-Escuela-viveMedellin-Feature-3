"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { getComments, createComment, deleteComment as apiDeleteComment, reportComment as apiReportComment, type BackendComment } from "@/lib/api/comments"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/context/notifications-context"
import type { User } from "@/lib/api/auth"

// Frontend-specific comment structure
export type Comment = {
  id: string
  text: string
  author: {
    id: string
    name: string
    initials: string
    avatar?: string
  }
  createdAt: string
  updatedAt?: string
  parentCommentId: string | null
  replies: Comment[]
  reportCount?: number
  isHidden?: boolean
}

type CommentsContextType = {
  comments: Comment[]
  visibleComments: Comment[]
  showAllComments: boolean
  toggleShowAllComments: () => void
  addComment: (text: string, parentCommentId: string | null) => Promise<void>
  editComment: (id: string, text: string) => void
  deleteComment: (id: string) => void
  reportComment: (id: string) => void
  hideComment: (id: string) => void
  unhideComment: (id: string) => void
  refreshComments: () => Promise<void>
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined)

// Helper functions for user cache management
const getUserFromCache = (userId: string): string | null => {
  try {
    const cache = localStorage.getItem('commentsUsersCache');
    if (cache) {
      const users = JSON.parse(cache);
      return users[userId] ?? null;
    }
  } catch (error) {
    console.warn('Error reading user cache:', error);
  }
  return null;
};

const saveUserToCache = (userId: string, userName: string) => {
  try {
    const cache = localStorage.getItem('commentsUsersCache');
    const users = cache ? JSON.parse(cache) : {};
    users[userId] = userName;
    localStorage.setItem('commentsUsersCache', JSON.stringify(users));
  } catch (error) {
    console.warn('Error saving to user cache:', error);
  }
};

// Helper to validate if a comment is valid
const isValidComment = (comment: unknown): comment is BackendComment => {
  if (!comment || typeof comment !== 'object') return false
  
  const c = comment as Record<string, unknown>
  return !!(c.idComentario && 
           c.idUsuario && 
           c.contenido && 
           typeof c.contenido === 'string' &&
           c.contenido.trim().length > 0 &&
           typeof c.reporteCuenta === 'number')
}

// Helper to transform backend comments to frontend format
const transformComment = (comment: BackendComment, users: { [key: string]: User | undefined }, loggedInUser: User | null): Comment => {
  const authorId = comment.idUsuario.toString()
  
  // Check if this comment belongs to the logged-in user
  const isLoggedInUserComment = loggedInUser && loggedInUser.id === authorId
  
  let authorName: string;
  
  if (isLoggedInUserComment) {
    // If it's the logged-in user's comment, use their name and save to cache
    authorName = loggedInUser.userName && loggedInUser.userName !== 'Usuario' 
      ? loggedInUser.userName 
      : `Participante ${authorId}`;
    saveUserToCache(authorId, authorName);
  } else if (users[authorId]?.userName) {
    // If we have user info in the users map, use it and save to cache
    authorName = users[authorId].userName;
    saveUserToCache(authorId, authorName);
  } else {
    // Try to get from cache first
    const cachedName = getUserFromCache(authorId);
    if (cachedName) {
      authorName = cachedName;
    } else {
      // Fallback to a more friendly name
      authorName = `Participante ${authorId}`;
    }
  }

  // Crear iniciales de forma segura
  const getInitials = (name: string) => {
    if (!name) return "P"
    
    // Si el nombre es del formato "Participante X", usar "P" + el número
    if (name.startsWith("Participante ")) {
      const number = name.split(" ")[1];
      return `P${number.slice(-1)}`;
    }
    
    // Para nombres normales, usar las iniciales
    return name
      .split(" ")
      .map((n: string) => n[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2) || "P"
  }

  return {
    id: comment.idComentario.toString(),
    text: comment.contenido.trim(),
    author: {
      id: authorId,
      name: authorName,
      initials: getInitials(authorName),
    },
    createdAt: comment.fechaCreacion || new Date().toISOString(),
    parentCommentId: comment.comentarioPadreId?.toString() ?? null,
    replies: [], // Replies will be structured separately
    reportCount: comment.reporteCuenta || 0,
    isHidden: (comment.reporteCuenta || 0) >= 3,
  }
}

const updateCommentInTree = (comments: Comment[], updateFn: (comment: Comment) => Comment): Comment[] => {
  return comments.map(comment => ({
    ...updateFn(comment),
    replies: comment.replies.length > 0 ? updateCommentInTree(comment.replies, updateFn) : []
  }))
}

const addReplyToParent = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...comment.replies, newReply] }
    }
    if (comment.replies.length > 0) {
      return { ...comment, replies: addReplyToParent(comment.replies, parentId, newReply) }
    }
    return comment
  })
}

const filterCommentAndReplies = (comments: Comment[], commentId: string): Comment[] => {
  return comments
    .filter(comment => comment.id !== commentId)
    .map(comment => ({
      ...comment,
      replies: filterCommentAndReplies(comment.replies, commentId)
    }))
}

export function CommentsProvider({ children }: { readonly children: React.ReactNode }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [showAllComments, setShowAllComments] = useState(false)
  const [hasLoadError, setHasLoadError] = useState(false)
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Calculate visible comments based on showAllComments state
  const visibleComments = useMemo(() => {
    // Filter out hidden comments unless the user is the author
    const filterHidden = (comment: Comment): Comment | null => {
      if (comment.isHidden && comment.author.id !== user?.id) {
        return null
      }
      
      // Process replies recursively
      const filteredReplies = comment.replies
        .map(filterHidden)
        .filter((reply): reply is Comment => reply !== null)
      
      return {
        ...comment,
        replies: filteredReplies
      }
    }
    
    const filteredComments = comments
      .map(filterHidden)
      .filter((comment): comment is Comment => comment !== null)
    
    if (showAllComments) {
      return filteredComments
    }
    // Show only first 3 comments when collapsed
    return filteredComments.slice(0, 3)
  }, [comments, showAllComments, user?.id])

  const toggleShowAllComments = useCallback(() => {
    setShowAllComments(prev => !prev)
  }, [])

  const fetchAndStructureComments = useCallback(async () => {
    try {
      console.log("🔄 Cargando comentarios desde el servidor...")
      const backendComments = await getComments()
      console.log("📥 Comentarios recibidos del backend:", backendComments.length, "comentarios")
      
      if (!Array.isArray(backendComments)) {
        console.error("❌ Respuesta del backend no es un array:", backendComments)
        setComments([])
        return
      }

      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // Create a users map with the logged-in user if available
      const users: { [key: string]: User } = {}
      if (user) {
        users[user.id] = user
        const displayName = user.userName && user.userName !== 'Usuario' ? user.userName : `Usuario ${user.id}`;
        console.log("👤 Usuario actual:", displayName, "(ID:", user.id, ")")
      }

      // First pass: filter valid comments and transform them
      let successfulTransformations = 0
      let invalidComments = 0
      
      backendComments.forEach((comment, index) => {
        if (!isValidComment(comment)) {
          console.warn(`⚠️ Comentario inválido ignorado en posición ${index + 1}:`, comment)
          invalidComments++
          return
        }
        
        try {
          const transformedComment = transformComment(comment, users, user)
          commentMap.set(comment.idComentario.toString(), transformedComment)
          successfulTransformations++
        } catch (error) {
          console.error(`❌ Error transformando comentario ${index + 1}:`, comment, error)
          invalidComments++
        }
      })

      if (invalidComments > 0) {
        console.warn(`⚠️ Se ignoraron ${invalidComments} comentarios inválidos de ${backendComments.length} total`)
      }
      console.log(`✅ Transformados ${successfulTransformations} comentarios válidos`)

      // Second pass: build the hierarchy
      commentMap.forEach((comment) => {
        if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
          const parent = commentMap.get(comment.parentCommentId)
          parent?.replies.push(comment)
        } else {
          rootComments.push(comment)
        }
      })

      const sortedComments = [...rootComments].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      console.log("🎯 Comentarios principales organizados:", sortedComments.length)
      setComments(sortedComments)
      setHasLoadError(false)
    } catch (error) {
      console.error("❌ Error cargando comentarios:", error)
      setComments([])
      setHasLoadError(true)
    }
  }, [user])

  // Efecto separado para manejar notificaciones de error sin causar problemas de render
  useEffect(() => {
    if (hasLoadError) {
      const timer = setTimeout(() => {
        addNotification({
          type: "error",
          title: "Error al cargar comentarios",
          message: "No se pudieron cargar los comentarios. Usa el botón 'Refrescar' para intentar de nuevo.",
          duration: 5000
        })
        setHasLoadError(false)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [hasLoadError, addNotification])

  useEffect(() => {
    fetchAndStructureComments()
  }, [fetchAndStructureComments])

  // Effect to clean up cache when user logs out
  useEffect(() => {
    if (!user) {
      // Don't clear cache immediately when user logs out
      // This allows showing cached names even when logged out
      console.log("👤 Usuario deslogueado, manteniendo caché de nombres")
    }
  }, [user])

  const addComment = useCallback(
    async (text: string, parentCommentId: string | null) => {
      if (!user) {
        console.error("User must be logged in to comment")
        alert("Debes iniciar sesión para comentar")
        return
      }
      
      try {
        console.log("📝 Creando comentario:", { 
          text: text.substring(0, 50) + "...", 
          parentCommentId, 
          userId: user.id,
          userName: user.userName && user.userName !== 'Usuario' ? user.userName : `Usuario ${user.id}`
        })
        
        const newBackendComment = await createComment({
          content: text,
          parentCommentId: parentCommentId ? parseInt(parentCommentId, 10) : null,
        })
        
        console.log("✅ Comentario creado en el backend:", newBackendComment)
        
        const users = { [user.id]: user }
        const newComment = transformComment(newBackendComment, users, user)

        setComments(prevComments => {
          const updatedComments = newComment.parentCommentId
            ? addReplyToParent(prevComments, newComment.parentCommentId, newComment)
            : [newComment, ...prevComments]
          
          console.log("🔄 Estado actualizado, total comentarios:", updatedComments.length)
          return updatedComments
        })

        addNotification({
          type: "success",
          title: "Comentario publicado",
          message: parentCommentId ? "Tu respuesta se ha publicado correctamente" : "Tu comentario se ha publicado correctamente",
          duration: 3000
        })

        // Verificar persistencia recargando después de un momento
        setTimeout(() => {
          console.log("🔍 Verificando persistencia del comentario...")
          fetchAndStructureComments()
        }, 1500)
        
      } catch (error) {
        console.error("❌ Error publicando comentario:", error)
        addNotification({
          type: "error",
          title: "Error al publicar",
          message: "No se pudo publicar el comentario. Por favor, intenta de nuevo.",
          duration: 5000
        })
      }
    },
    [user, addNotification, fetchAndStructureComments],
  )

  const editComment = useCallback((id: string, text: string) => {
    if (!user) {
      console.error("User must be logged in to edit comment")
      return
    }
    
    setComments(prevComments => 
      updateCommentInTree(prevComments, comment => {
        if (comment.id === id && comment.author.id === user.id) {
          return { ...comment, text, updatedAt: new Date().toISOString() }
        }
        return comment
      })
    )

    addNotification({
      type: "success",
      title: "Comentario actualizado",
      message: "Tu comentario se ha editado correctamente",
      duration: 3000
    })
  }, [user, addNotification])

  const deleteComment = useCallback(async (id: string) => {
    if (!user) {
      console.error("User must be logged in to delete comment")
      alert("Debes iniciar sesión para eliminar comentarios")
      return
    }
    
    try {
      await apiDeleteComment(parseInt(id, 10))
      setComments(prevComments => filterCommentAndReplies(prevComments, id))
      
      addNotification({
        type: "success",
        title: "Comentario eliminado",
        message: "El comentario se ha eliminado correctamente",
        duration: 3000
      })
    } catch (error) {
      console.error("Failed to delete comment:", error)
      addNotification({
        type: "error",
        title: "Error al eliminar",
        message: "No se pudo eliminar el comentario. Asegúrate de ser el autor.",
        duration: 5000
      })
    }
  }, [user, addNotification])

  const reportComment = useCallback(async (id: string) => {
    if (!user) {
      console.error("User must be logged in to report comment")
      alert("Debes iniciar sesión para reportar comentarios")
      return
    }

    try {
      console.log("🚨 Reportando comentario", id, "por usuario", user.userName && user.userName !== 'Usuario' ? user.userName : `Usuario ${user.id}`)
      
      // Enviar reporte al backend
      await apiReportComment(parseInt(id, 10))
      
      console.log("✅ Reporte enviado al backend exitosamente")
      
      // Mostrar notificación de éxito
      setTimeout(() => {
        addNotification({
          type: "warning",
          title: "Comentario reportado",
          message: "Gracias por reportar el comentario. Si recibe 3 reportes será ocultado automáticamente.",
          duration: 4000
        })
      }, 0)
      
      // Refrescar comentarios del servidor para obtener el estado actualizado con los reportes
      setTimeout(() => {
        console.log("🔄 Refrescando comentarios para verificar el estado de reportes...")
        fetchAndStructureComments()
      }, 500)
      
    } catch (error) {
      console.error("❌ Error al reportar comentario:", error)
      setTimeout(() => {
        addNotification({
          type: "error",
          title: "Error al reportar",
          message: "No se pudo reportar el comentario. Por favor, intenta de nuevo.",
          duration: 5000
        })
      }, 0)
    }
  }, [user, addNotification, fetchAndStructureComments])

  const hideComment = useCallback((id: string) => {
    setComments(prevComments => 
      updateCommentInTree(prevComments, comment => {
        if (comment.id === id) {
          return { ...comment, isHidden: true }
        }
        return comment
      })
    )
  }, [])

  const unhideComment = useCallback((id: string) => {
    setComments(prevComments => 
      updateCommentInTree(prevComments, comment => {
        if (comment.id === id) {
          return { ...comment, isHidden: false }
        }
        return comment
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      comments,
      visibleComments,
      showAllComments,
      toggleShowAllComments,
      addComment,
      editComment,
      deleteComment,
      reportComment,
      hideComment,
      unhideComment,
      refreshComments: fetchAndStructureComments,
    }),
    [comments, visibleComments, showAllComments, toggleShowAllComments, addComment, editComment, deleteComment, reportComment, hideComment, unhideComment, fetchAndStructureComments],
  )

  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
}

export function useComments() {
  const context = useContext(CommentsContext)
  if (context === undefined) {
    throw new Error("useComments must be used within a CommentsProvider")
  }
  return context
}
