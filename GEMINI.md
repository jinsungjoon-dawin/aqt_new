# Gemini Project Configuration
> # Gemini 프로젝트 설정

This document provides instructions and configurations for the Gemini CLI to effectively interact with this project.
> 이 문서는 Gemini CLI가 이 프로젝트와 효과적으로 상호 작용하기 위한 지침 및 구성을 제공합니다.

## Project Overview
> ## 프로젝트 개요

This is a web application built with a Svelte frontend and a Node.js (Express) backend. The application appears to be a dashboard for data verification and performance testing.
> 이것은 Svelte 프론트엔드와 Node.js (Express) 백엔드로 구축된 웹 애플리케이션입니다. 이 애플리케이션은 데이터 검증 및 성능 테스트를 위한 대시보드인 것으로 보입니다.

## Key Technologies
> ## 주요 기술

- **Frontend:** Svelte, Svelte-i18n, Chart.js, Tailwind CSS
- **Backend:** Node.js, Express, MariaDB, ssh2
- **Build Tool:** Vite
- **Language:** TypeScript

## Project Structure
> ## 프로젝트 구조

- `src/`: Contains the Svelte frontend application code.
    - `lib/`: Svelte components.
    - `assets/`: Static assets like images and fonts.
    - `locales/`: Language files for internationalization.
- `servers/`: Contains the Node.js Express backend server code.
    - `cntr/`: Controllers for handling business logic.
    - `db/`: Database connection and configuration.
    - `model/`: Database models.
- `public/`: Publicly accessible files.
- `dist/`: Build output directory.

> - `src/`: Svelte 프론트엔드 애플리케이션 코드를 포함합니다.
> - `lib/`: Svelte 컴포넌트.
> - `assets/`: 이미지 및 글꼴과 같은 정적 자산.
> - `locales/`: 국제화를 위한 언어 파일.
> - `servers/`: Node.js Express 백엔드 서버 코드를 포함합니다.
> - `cntr/`: 비즈니스 로직을 처리하기 위한 컨트롤러.
> - `db/`: 데이터베이스 연결 및 구성.
> - `model/`: 데이터베이스 모델.
> - `public/`: 공개적으로 액세스할 수 있는 파일.
> - `dist/`: 빌드 출력 디렉토리.

## Development
> ## 개발

### 1. Install Dependencies
> ### 1. 의존성 설치

To install all the necessary dependencies, run the following command in the project root directory:
> 필요한 모든 의존성을 설치하려면 프로젝트 루트 디렉토리에서 다음 명령을 실행하십시오.

```bash
npm install
```

### 2. Run the Development Servers
> ### 2. 개발 서버 실행

This project has a Svelte frontend and a Node.js backend.
> 이 프로젝트에는 Svelte 프론트엔드와 Node.js 백엔드가 있습니다.

- **Frontend:** To start the Vite development server for the Svelte app, run:
> - **프론트엔드:** Svelte 앱용 Vite 개발 서버를 시작하려면 다음을 실행하십시오.

```bash
npm run dev
```

- **Backend:** To start the Node.js server, run:
> - **백엔드:** Node.js 서버를 시작하려면 다음을 실행하십시오.

```bash
node servers/server.js
```

## Build
> ## 빌드

To build the Svelte application for production, run:
> 프로덕션용 Svelte 애플리케이션을 빌드하려면 다음을 실행하십시오.

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.
> 빌드 아티팩트는 `dist/` 디렉토리에 저장됩니다.

## Testing
> ## 테스트

To run the type checker and linter, use the following command:
> 유형 검사기 및 린터를 실행하려면 다음 명령을 사용하십시오.

```bash
npm run check
```

### 답변
답변은 한글어로만 합니다.


2025-11-26
1. 비교시 상세보기로 틀린부분 팝업으로 구현
2. 조회필터에 신규, 수정, 삭제, 같은것들 필터하는 기능 추가