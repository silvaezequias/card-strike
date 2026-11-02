import { apiError } from "./users";

/* Ajudante das rotas da API: lê o corpo JSON, passa os parâmetros da URL
   e transforma erros conhecidos na resposta certa. */

type Params = Record<string, string>;

export const route =
  <P extends Params = Params>(handler: (input: { body: Record<string, unknown>; params: P; request: Request }) => Promise<unknown>) =>
  async (request: Request, context: { params: Promise<P> }) => {
    try {
      const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
      const params = (await context?.params) ?? ({} as P);
      const result = await handler({ body, params, request });
      return Response.json(result ?? { ok: true });
    } catch (error) {
      return apiError(error);
    }
  };
