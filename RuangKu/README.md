# React + TypeScript + Vite

## Menjalankan aplikasi

```bash
npm install
npm run dev      # server dev (Vite)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Akun demo

Form login hanya menerima akun di bawah ini — satu akun untuk tiap peran,
semuanya memakai kata sandi yang sama: `ruangku123`.

| Peran    | Email                  | Kata sandi |
| -------- | ---------------------- | ---------- |
| Penyewa  | `alana@ruangku.test`   | `ruangku123` |
| Penyedia | `penyedia@ruangku.test`| `ruangku123` |
| Admin    | `admin@ruangku.test`   | `ruangku123` |

Catatan:

- Email/sandi yang tidak cocok dengan daftar di atas akan menampilkan error
  "Email atau kata sandi tidak cocok".
- Setelah masuk, semua peran diarahkan ke katalog (`/beranda`). Dashboard
  penyedia & admin belum ada desainnya (RENCANA-IMPLEMENTASI.md §7), jadi
  menu **Dashboard** di header hanya tampil untuk penyewa.
- Daftar akun didefinisikan di `src/context/AuthContext.tsx` (`AKUN_DEMO`).

---

## Catatan template (bawaan Vite)

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
