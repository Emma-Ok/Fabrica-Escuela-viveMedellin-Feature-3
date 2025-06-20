# SonarQube Configuration - Proyecto Completo

## Estructura del Proyecto

```
Packages/
├── backend/
│   ├── sonar-project.properties     # Configuración SonarQube Backend
│   ├── README-SONAR.md             # Instrucciones Backend
│   ├── pom.xml                     # POM con JaCoCo configurado
│   ├── microservice-user/
│   ├── microservice-comment/
│   ├── microservice-gateway/
│   ├── microservice-eureka/
│   └── microservice-config/
└── frontend/
    ├── sonar-project.properties     # Configuración SonarQube Frontend
    └── ... (archivos Next.js/React)
```

## Configuraciones Separadas

Este proyecto utiliza **dos configuraciones separadas** de SonarQube:

### 1. Frontend (JavaScript/TypeScript)
- **Ubicación**: `frontend/sonar-project.properties`
- **Tecnologías**: Next.js, React, TypeScript
- **Project Key**: `Emma-Ok_Fabrica-Escuela-viveMedellin-Feature-3`

### 2. Backend (Java/Maven)
- **Ubicación**: `backend/sonar-project.properties`
- **Tecnologías**: Spring Boot, Java 21, Maven multi-módulo
- **Project Key**: `Emma-Ok_Fabrica-Escuela-viveMedellin-Backend`

## ¿Por qué configuraciones separadas?

1. **Tecnologías diferentes**: Frontend (JS/TS) vs Backend (Java)
2. **Métricas específicas**: Cada stack tiene sus propios patrones de testing
3. **Análisis granular**: SonarQube puede analizar cada proyecto independientemente
4. **Configuraciones específicas**: Diferentes exclusiones y patrones

## Comandos de ejecución

### Análisis Frontend
```bash
cd frontend/
npm test -- --coverage
npx sonar-scanner \
  -Dsonar.projectKey=Emma-Ok_Fabrica-Escuela-viveMedellin-Feature-3 \
  -Dsonar.organization=emmanueludea \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=YOUR_SONAR_TOKEN
```

### Análisis Backend
```bash
cd backend/
mvn clean compile test jacoco:report sonar:sonar \
  -Dsonar.projectKey=Emma-Ok_Fabrica-Escuela-viveMedellin-Backend \
  -Dsonar.organization=emmanueludea \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=YOUR_SONAR_TOKEN
```

## Resultados en SonarCloud

Tendrás dos proyectos separados en SonarCloud:

1. **Frontend Project**: Emma-Ok_Fabrica-Escuela-viveMedellin-Feature-3
2. **Backend Project**: Emma-Ok_Fabrica-Escuela-viveMedellin-Backend

## Beneficios de esta configuración

- ✅ Análisis específico por tecnología
- ✅ Métricas de calidad apropiadas para cada stack
- ✅ Reportes de cobertura correctos (LCOV para JS, JaCoCo para Java)
- ✅ Configuraciones de exclusión apropiadas
- ✅ Facilita CI/CD independiente por proyecto
- ✅ Mejor organización y claridad en los reportes

## Configuración CI/CD

Para automatizar en CI/CD, puedes configurar dos jobs separados:

```yaml
# Ejemplo GitHub Actions
jobs:
  sonar-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Frontend SonarQube
        working-directory: ./frontend
        run: |
          npm ci
          npm test -- --coverage
          npx sonar-scanner

  sonar-backend:
    runs-on: ubuntu-latest  
    steps:
      - name: Backend SonarQube
        working-directory: ./backend
        run: |
          mvn clean compile test jacoco:report sonar:sonar
``` 