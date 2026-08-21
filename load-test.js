// TESTE DE CARGA — AG Imports
//
// Ferramenta: k6 (gratuita, https://k6.io/docs/get-started/installation/)
//
// COMO RODAR:
//   1. Instala o k6 na sua máquina (link acima — Windows: choco install k6,
//      ou baixa o instalador direto do site)
//   2. Troca a BASE_URL abaixo pelo endereço real do site (local ou já publicado)
//   3. No terminal, dentro da pasta onde salvar esse arquivo, roda:
//        k6 run load-test.js
//
// O QUE ELE FAZ:
//   Sobe de 10 → 100 → 1000 usuários simulados gradualmente (não de uma vez,
//   pra você ver EXATAMENTE em qual ponto o site começa a ficar lento ou a
//   falhar), acessando a landing page e a tela de login repetidamente.
//
// COMO LER O RESULTADO:
//   - "http_req_duration" = tempo de resposta. Abaixo de 500ms é bom,
//     acima de 2s é ruim.
//   - "http_req_failed" = % de requisições que falharam. Deveria ficar
//     em 0% ou bem perto disso.
//   - Se o tempo de resposta disparar (ex: de 200ms pra 5s) numa fase
//     específica (tipo quando chega em 500 usuários), é ali que o site
//     "quebra" — é essa informação que você precisa pra saber se pode
//     lançar com segurança ou se precisa de mais capacidade de servidor
//     antes.

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "https://SEU-DOMINIO-AQUI.com"; // <-- troque pelo endereço real

export const options = {
  stages: [
    { duration: "30s", target: 10 },   // aquece com 10 usuários
    { duration: "1m", target: 10 },    // mantém 10 por 1 minuto
    { duration: "30s", target: 100 },  // sobe pra 100
    { duration: "2m", target: 100 },   // mantém 100 por 2 minutos
    { duration: "30s", target: 1000 }, // sobe pra 1000 (o teste de verdade)
    { duration: "2m", target: 1000 },  // mantém 1000 por 2 minutos
    { duration: "30s", target: 0 },    // esfria
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% das respostas devem vir em menos de 2s
    http_req_failed: ["rate<0.05"],    // menos de 5% de erro é aceitável
  },
};

export default function () {
  const home = http.get(`${BASE_URL}/`);
  check(home, { "landing carregou (200)": (r) => r.status === 200 });
  sleep(1);

  const auth = http.get(`${BASE_URL}/auth`);
  check(auth, { "login carregou (200)": (r) => r.status === 200 });
  sleep(1);
}
