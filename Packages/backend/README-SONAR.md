# SonarQube Configuration - Backend

## Configuración

Este proyecto backend está configurado para análisis con SonarQube usando un proyecto multi-módulo Maven.

### Requisitos

- Java 21
- Maven 3.8+
- SonarQube Server o SonarCloud
- Token de autenticación de SonarQube

## Comandos para ejecutar análisis

### 1. Compilar y generar reportes de cobertura

```bash
# Desde la carpeta backend/
mvn clean compile test jacoco:report
```

### 2. Ejecutar análisis de SonarQube

#### Con SonarCloud
```bash
mvn sonar:sonar \
  -Dsonar.projectKey=Emma-Ok_Fabrica-Escuela-viveMedellin-Backend \
  -Dsonar.organization=emmanueludea \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=YOUR_SONAR_TOKEN
```

#### Con SonarQube Server local
```bash
mvn sonar:sonar \
  -Dsonar.projectKey=Emma-Ok_Fabrica-Escuela-viveMedellin-Backend \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_SONAR_TOKEN
```

### 3. Comando completo (recomendado)
```bash
mvn clean compile test jacoco:report sonar:sonar \
  -Dsonar.projectKey=Emma-Ok_Fabrica-Escuela-viveMedellin-Backend \
  -Dsonar.organization=emmanueludea \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=YOUR_SONAR_TOKEN
```

## Variables de entorno (opcional)

Puedes configurar las siguientes variables de entorno para evitar pasarlas como parámetros:

```bash
export SONAR_TOKEN=your_sonar_token_here
export SONAR_HOST_URL=https://sonarcloud.io
export SONAR_ORGANIZATION=emmanueludea
```

## Microservicios incluidos

- microservice-user
- microservice-comment  
- microservice-gateway
- microservice-eureka
- microservice-config

## Reportes generados

Los reportes de cobertura JaCoCo se generan en:
- `{microservice}/target/site/jacoco/index.html` (para cada microservicio)

## Configuración de exclusiones

El análisis excluye automáticamente:
- Archivos en `/target/`
- Archivos `.class`
- Scripts Maven wrapper (`mvnw`, `mvnw.cmd`)
- Dockerfiles 