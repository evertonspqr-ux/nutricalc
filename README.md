# NutriCalc

Aplicação estática e educativa para organização alimentar semanal, catálogo local de alimentos, leitura assistida de rótulos e geração de PDF.

## Privacidade

- Não possui conta, backend ou banco de dados.
- Perfil, alimentos e plano ficam no `localStorage` do navegador.
- Fotos de rótulos não são persistidas pelo aplicativo.
- PDF e OCR usam bibliotecas externas com integridade fixada; consulte o aviso no aplicativo.

## Executar localmente

```bash
python3 -m http.server 9012
```

Abra `http://127.0.0.1:9012`.

## Testes

```bash
node dieta.test.js
```

## Publicação

O projeto contém `vercel.json` com cabeçalhos de segurança. O deploy de produção é feito pela Vercel.