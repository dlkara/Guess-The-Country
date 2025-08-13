# Guess The Country
좌표로 제시되는 랜덤 위치를 보고 나라(또는 대륙) 를 맞히는 웹 게임입니다.
프런트는 정적 HTML/CSS/JS(jQuery), 백엔드는 Vercel 서버리스 함수로 키 보호(Unsplash) 및 지오코딩 정책 준수(Nominatim) 를 처리합니다.

> 🔗 데모
> Production: https://guess-the-country-three.vercel.app/
>
> PR/브랜치마다 Vercel Preview URL이 자동 생성됩니다.


## ✨ 주요 기능

- 랜덤 좌표 → 역지오코딩으로 국가명 + ISO 코드 획득(Nominatim)

- 국가 정보/국기/수도 표시(REST Countries)

- 힌트 3종: 이미지(Unsplash), 수도, 국기

- 난이도/라운드/점수 관리, 세계지도(OpenStreetMap iFrame) 표시

- 서버리스 프록시로 외부 API 호출(키 비공개, 캐시/레이트리밋 용이)


## 🧱 기술 스택

| 영역     | 사용                                       |
| ------ | ---------------------------------------- |
| 프런트    | HTML, CSS, jQuery(ES2020+)               |
| 지도     | **OpenStreetMap iFrame**(키 불필요)          |
| 서버리스   | **Vercel Functions** (`/api/*`)          |
| 외부 API | Nominatim(OSM), REST Countries, Unsplash |
| 배포/운영  | Vercel(프리뷰/프로덕션, 엣지 캐시)                  |


## 📂 폴더 구조
```text
/
├─ index.html / game.html / result.html / about.html
├─ css/ , js/ (game.js 핵심 로직)
├─ api/
│  ├─ geocode.js      # 좌표→국가(ISO 코드 포함) 프록시
│  └─ hint-image.js   # Unsplash 이미지 프록시
├─ vercel.json        # 보안 헤더 등
└─ .env.example       # 로컬 개발용 환경변수 템플릿
```
> 선택: `/api/country.js` 프록시를 추가할 수 있지만, 현재는 클라이언트에서 REST Countries를 직접 호출합니다(키 불필요).


## 🔐 환경변수
- Vercel(Project → Settings → Environment Variables) Production/Preview 모두 추가:

  - UNSPLASH_ACCESS_KEY (필수) — Unsplash Access Key

  - CONTACT_EMAIL (권장) — Nominatim 정책용 연락처(예: you@example.com)

- 로컬 개발 시 .env에도 동일 이름으로 넣으십시오(.env.example 참고).


## ▶️ 실행 방법
### 로컬(권장: Vercel CLI)
```bash
npm i -g vercel
vercel login
vercel dev   # http://localhost:3000
```

### 배포(Vercel)
1. vercel.com → New Project → GitHub 리포지토리 선택
2. Framework: Other / Static HTML, Root: /
3. Environment Variables 등록(위 표) → Deploy


## ⚙️ 동작 원리(핵심)
1) ISO 코드 우선 조회(오검출 방지):

    - /api/geocode가 국가명 + ISO 3166-1 alpha-2 코드(예: US, KR)를 반환

    - game.js에서 getCountryDetails(name, code)가 /v3.1/alpha/{code} 우선 조회

        → United States ↔ U.S. Virgin Islands 같은 부분 일치 오검출 제거

2) 정답 판정(다국어·악센트 허용) :  

   - REST Countries의 altSpellings + translations를 수집 → Set → 중복 제거
   
   - normalize('NFD') + \p{Diacritic}로 악센트 제거, 소문자/공백 정규화

3) 지도 :  
   - OpenStreetMap iFrame 사용(키 불필요)

   - 라운드 종료 시 bbox(경계)를 계산해 항상 마커가 화면에 포함되도록 구성


## 📡 서버리스 API

### 1. `GET /api/geocode?lat=<num>&lng=<num>`

```json
{ "country": "South Korea", "code": "KR" }
```

- 캐시: s-maxage=60, stale-while-revalidate=300 (엣지 캐시)

### 2. `GET /api/hint-image?country=<name>`

```json
{ "url": "https://images.unsplash.com/..." }
```

- 환경변수: UNSPLASH_ACCESS_KEY 필요

- 캐시: s-maxage=43200, stale-while-revalidate=86400

> 필요 시 /api/country?name=...로 REST Countries를 서버에서 프록시할 수 있습니다
>
> (현재는 클라이언트 직접 호출).


## 🖼 스크린샷/GIF
docs/screenshot-1.png — 게임 화면

docs/screenshot-2.gif — 힌트/채점 플로우


## 🧪 품질/운영 팁

- .env는 절대 커밋 금지 → .env.example 제공

- 프록시에 간단 레이트리밋(IP 기준) 권장

- Nominatim은 User-Agent/From(이메일) 헤더 요구 → CONTACT_EMAIL 지정

- 실패 시 UI 폴백: 힌트 버튼 비활성화·안내 문구


## ❓ FAQ
> **왜 구글맵이 아닌가요?**
> 
> 과금/키 관리 없이 OSM iFrame으로 충분합니다. 필요 시 Leaflet/상용 맵으로 확장 가능합니다.

> **필요한 비밀키는?**
> 
> 현재는 Unsplash만 필요합니다. 나머지는 키가 없습니다.


## 🚧 한계 및 개선 계획
- 좌표 샘플링 개선(랜드마스크/국경 폴리곤), 시도 횟수 상한/타임아웃

- 서버 검증 기반 랭킹/치트 방지, 계정/세션 도입

- TypeScript 전환, E2E 테스트(Playwright)

- Leaflet 전환 및 UX 개선


## 📄 라이선스
- 코드: MIT (변경 가능)

- 데이터/API: 각 제공처(Unsplash, OSM, REST Countries) 약관을 따릅니다.


## ✅ 빠른 체크리스트
- Vercel 환경변수 설정(Unsplash, Contact Email)

- /api/geocode / /api/hint-image 200 응답 확인

- 게임 플로우(힌트/채점/지도) 정상 동작

- README의 데모 링크/이미지 경로 교체 완료
- 