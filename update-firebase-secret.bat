@echo off
echo Firebase Service Account 업데이트 스크립트
echo.
echo 다운로드한 Firebase 서비스 계정 JSON 파일을 이 스크립트와 같은 폴더에 두세요.
echo.
set /p filename="JSON 파일 이름을 입력하세요 (예: ts-front-479305-firebase-adminsdk.json): "
echo.
if not exist "%filename%" (
    echo 오류: %filename% 파일을 찾을 수 없습니다.
    pause
    exit /b 1
)
echo GitHub Secret 업데이트 중...
gh secret set FIREBASE_SERVICE_ACCOUNT < "%filename%"
if %errorlevel% equ 0 (
    echo.
    echo ✅ FIREBASE_SERVICE_ACCOUNT가 성공적으로 업데이트되었습니다!
    echo.
    echo 이제 실패한 배포를 재실행할 수 있습니다:
    echo   gh run rerun 21265065922
) else (
    echo.
    echo ❌ 업데이트 실패. GitHub CLI 인증 상태를 확인하세요.
)
echo.
pause
