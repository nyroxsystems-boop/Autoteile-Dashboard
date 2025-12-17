# Dashboard → WAWI Integration

Dieses Dashboard spricht ausschließlich mit dem WAWI-Backend (InvenTree-basiert).

## Env Variablen

- `VITE_API_BASE_URL` – z. B. `https://wawi-new.onrender.com`
- `VITE_WAWI_API_TOKEN` – Service-/API-Token für das WAWI (`Authorization: Token <TOKEN>`)
- `VITE_DISABLE_LOGIN` – bestehender Login-Mechanismus (wird nicht durch den Access-Gate geändert)
- `VITE_ACCESS_GATE` – optionaler Access-Code-Gate vor der App (`true`/`false`, case-insensitive)
- `VITE_ACCESS_CODE` – erwarteter Access Code (Render Env setzen/ändern; client-seitig, kein Secret)

Hinweis: Der Access Code wird beim Vite-Build ins Frontend-Bundle eingebettet. Er ist nur als temporärer Schutz gedacht und darf nicht als echter Secret-/Auth-Mechanismus verstanden werden. Bitte niemals Tokens oder `VITE_ACCESS_CODE` in `console.log` ausgeben.

## Kurztest (curl)

```bash
curl -H "Authorization: Token <TOKEN>" https://wawi-new.onrender.com/api/user/
```

## Dev-Hinweis

In `dev` zeigt eine kleine Info-Leiste im Dashboard, ob Base-URL und Token gesetzt sind und kann Health/Me testen.
