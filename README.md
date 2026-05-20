# WM Tippspiel 2026

Firmeninternes Tippspiel für die FIFA WM 2026 (USA / Kanada / Mexiko).

## Stack
Next.js 14 · Supabase · Tailwind · Vercel · TypeScript

## Features
- Tippen aller 104 Spiele mit Auto-Save
- Sonderwetten: Weltmeister, Torschützenkönig, 12 Gruppensieger
- Magic-Link Login (kein Passwort)
- Automatische Synchronisation alle 2h via football-data.org
- Manuelles Override im Admin-Panel falls API ausfällt
- Einladen-Seite mit Link, QR und Mail-Vorlage
- Live-Rangliste mit Statistiken

## Punktesystem
- 3 P für exaktes Ergebnis
- 1 P für richtige Tendenz
- 15 P Weltmeister
- 10 P Torschützenkönig
- 2 P pro richtigem Gruppensieger (max. 24)

## Deadline
2026-06-11 20:00 (Anpfiff WM-Eröffnung)

## Setup
Siehe Vercel-Deployment-Config. ENV-Variablen erforderlich:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- FOOTBALL_DATA_API_KEY
- CRON_SECRET
- NEXT_PUBLIC_TIPP_DEADLINE
- ADMIN_EMAILS

## Lizenz
Internes Tool. Verwendung frei.

<!-- deploy trigger 2026-05-20T06:39:48.204Z -->
