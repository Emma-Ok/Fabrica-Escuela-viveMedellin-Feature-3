"use client"

import { useState } from "react"
import { Edit2, Trash2, X, Check, MessageSquare, AlertTriangle, Eye, EyeOff } from "lucide-react"
import type { Comment } from "@/context/comments-context"
import { useAuth } from "@/context/auth-context"
import { useComments } from "@/context/comments-context"
import Avatar from "@/components/atoms/avatar"
import Typography from "@/components/atoms/typography"
import TextArea from "@/components/atoms/text-area"
import IconButton from "@/components/atoms/icon-button"
import Button from "@/components/atoms/Button"

interface CommentItemProps {
  readonly comment: Comment
  readonly depth?: number
}

interface CommentActionsProps {
  readonly comment: Comment
  readonly isAuthor: boolean
  readonly hasReported: boolean
  readonly isEditing: boolean
  readonly onReply: () => void
  readonly onReport: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly onHide: () => void
  readonly onUnhide: () => void
}

function CommentActions({ 
  comment, 
  isAuthor, 
  hasReported, 
  isEditing,
  onReply, 
  onReport, 
  onEdit, 
  onDelete,
  onHide,
  onUnhide
}: CommentActionsProps) {
  const { user } = useAuth()
  
  if (!user) return null

  return (
    <div className="flex space-x-2">
      <IconButton onClick={onReply} label="Responder comentario" variant="secondary">
        <MessageSquare size={16} />
      </IconButton>
      
      {!isAuthor && (
        <IconButton 
          onClick={onReport} 
          label={hasReported ? "Ya reportaste este comentario" : "Reportar comentario"} 
          variant={hasReported ? "secondary" : "danger"}
          disabled={hasReported}
        >
          <AlertTriangle size={16} />
        </IconButton>
      )}
      
      {isAuthor && !isEditing && (
        <>
          <IconButton onClick={onEdit} label="Editar comentario" variant="secondary">
            <Edit2 size={16} />
          </IconButton>
          <IconButton onClick={onDelete} label="Eliminar comentario" variant="danger">
            <Trash2 size={16} />
          </IconButton>
          {comment.isHidden && (
            <IconButton onClick={onUnhide} label="Mostrar comentario" variant="secondary">
              <Eye size={16} />
            </IconButton>
          )}
          {!comment.isHidden && (comment.reportCount ?? 0) > 0 && (
            <IconButton onClick={onHide} label="Ocultar comentario" variant="secondary">
              <EyeOff size={16} />
            </IconButton>
          )}
        </>
      )}
    </div>
  )
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const { user } = useAuth()
  const { editComment, deleteComment, addComment, reportComment, hideComment, unhideComment } = useComments()

  // Ensure both IDs are strings for comparison
  const isAuthor = !!(user?.id && user.id.toString() === comment.author.id?.toString())
  // Simplificamos: permitir reportar siempre que no sea el autor
  const hasReported = false // Por simplicidad, permitimos reportar múltiples veces

  const handleEdit = () => {
    if (editText.trim() !== comment.text) {
      editComment(comment.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(comment.text)
    setIsEditing(false)
  }

  const handleReply = async () => {
    if (replyText.trim()) {
      await addComment(replyText.trim(), comment.id)
      setReplyText("")
      setIsReplying(false)
    }
  }

  const handleCancelReply = () => {
    setReplyText("")
    setIsReplying(false)
  }

  const handleReport = () => {
    if (!hasReported) {
      reportComment(comment.id)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Fecha no disponible"
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      // Show relative time for recent comments
      if (diffMinutes < 1) {
        return "Hace un momento"
      } else if (diffMinutes < 60) {
        return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`
      } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
      } else if (diffDays < 7) {
        return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
      } else {
        // For older comments, show full date
        return date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    } catch (error) {
      console.warn('Error formatting date:', dateString, error)
      return "Fecha no disponible"
    }
  }

  // Limit nesting depth for better UI
  const maxDepth = 3
  const currentDepth = depth < maxDepth ? depth : maxDepth

  // Use predefined margin classes for Tailwind
  const getMarginClass = (depth: number) => {
    switch (depth) {
      case 0: return ''
      case 1: return 'ml-8'
      case 2: return 'ml-16'
      default: return 'ml-24'
    }
  }
  
  const marginClass = getMarginClass(currentDepth)

  const isHiddenForViewer = comment.isHidden && !isAuthor

  return (
    <div className={`flex items-start gap-4 ${marginClass} ${isHiddenForViewer ? 'opacity-50' : ''}`}>
      <Avatar src={comment.author.avatar} alt={comment.author.name} initials={comment.author.initials} />

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Typography variant="body" className="font-medium">
              {comment.author.name}
            </Typography>
            <Typography variant="caption" color="secondary" className="mb-1">
              {formatDate(comment.createdAt)}
            </Typography>
            {(comment.reportCount ?? 0) > 0 && (
              <Typography variant="caption" className="text-orange-600">
                {comment.reportCount} reporte(s)
              </Typography>
            )}
          </div>

          <CommentActions
            comment={comment}
            isAuthor={isAuthor}
            hasReported={hasReported}
            isEditing={isEditing}
            onReply={() => setIsReplying(!isReplying)}
            onReport={handleReport}
            onEdit={() => setIsEditing(true)}
            onDelete={() => deleteComment(comment.id)}
            onHide={() => hideComment(comment.id)}
            onUnhide={() => unhideComment(comment.id)}
          />
        </div>

        {isHiddenForViewer ? (
          <Typography variant="body" color="secondary" className="italic">
            [Este comentario ha sido ocultado por múltiples reportes]
          </Typography>
        ) : (
          <>
            {isEditing ? (
              <div>
                <TextArea
                  id={`edit-comment-${comment.id}`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <div className="flex justify-end space-x-2">
                  <IconButton onClick={handleCancel} label="Cancelar edición" variant="secondary">
                    <X size={16} className="mr-1" /> Cancelar
                  </IconButton>
                  <IconButton onClick={handleEdit} label="Guardar cambios" variant="primary">
                    <Check size={16} className="mr-1" /> Guardar
                  </IconButton>
                </div>
              </div>
            ) : (
              <Typography variant="body" color="secondary">
                {comment.text}
              </Typography>
            )}
          </>
        )}

        {isReplying && (
          <div className="mt-4">
            <TextArea
              id={`reply-comment-${comment.id}`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Escribe tu respuesta..."
              className="mb-2"
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancelReply} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleReply} variant="primary" size="sm" disabled={!replyText.trim()}>
                Responder
              </Button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={currentDepth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
