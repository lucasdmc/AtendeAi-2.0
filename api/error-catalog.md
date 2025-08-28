# Error Catalog - AtendeAI 2.0 (MVP)

Use RFC7807 (application/problem+json).

| Code | Title                 | HTTP | Type                          | Detail/Notes                        |
|-----:|------------------------|-----:|-------------------------------|-------------------------------------|
| 1001 | Invalid payload        | 400  | /errors/invalid-payload       | Falha na validação de entrada       |
| 1002 | Unauthorized           | 401  | /errors/unauthorized          | JWT inválido/ausente               |
| 1003 | Forbidden              | 403  | /errors/forbidden             | Sem permissão para a ação          |
| 1004 | Not found              | 404  | /errors/not-found             | Recurso não encontrado              |
| 1005 | Conflict               | 409  | /errors/conflict              | Conflito de estado                  |
| 1006 | Rate limited           | 429  | /errors/rate-limited          | Respeitar header Retry-After        |
| 1007 | Unprocessable entity   | 422  | /errors/unprocessable-entity  | Erro de regra de negócio            |
| 1999 | Internal server error  | 500  | /errors/internal              | Erro inesperado                     |