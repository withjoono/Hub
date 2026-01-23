# Firebase 서비스 계정 키 생성 가이드

## 1. Firebase Console 접속
https://console.firebase.google.com/project/ts-front-479305/settings/serviceaccounts/adminsdk

## 2. 서비스 계정 키 생성
1. "새 비공개 키 생성" 버튼 클릭
2. JSON 파일 다운로드
3. 파일 내용 복사 (전체 JSON)

## 3. GitHub Secrets 업데이트

### 방법 1: GitHub 웹사이트
1. https://github.com/withjoono/Hub/settings/secrets/actions 접속
2. "FIREBASE_SERVICE_ACCOUNT" 찾기
3. "Update" 클릭
4. 복사한 JSON 전체를 붙여넣기
5. "Update secret" 클릭

### 방법 2: GitHub CLI 사용
```bash
# JSON 파일을 secret으로 등록
gh secret set FIREBASE_SERVICE_ACCOUNT < downloaded-key.json
```

## 4. 배포 재실행
```bash
gh run rerun <run-id>
# 또는 새로 커밋 푸시
```
