(function () {
  let $buttonBotAutoQueue = document.getElementById("js-bot-autoQueue");

  $buttonBotAutoQueue.addEventListener("click", autoQueue);

  let listadeDemandasPorAnalista = [];
  const CARGA_HORARIA_ANALISTA_MES = 176;
  const CARGA_HORARIA_ESTAGIARIO_MES = 140;
  const HORAS_CONFIGURAÇÃO_BOT = 2;
  
  // Dados de exemplo para teste
  const jsonfakeFila = JSON.stringify([
    {
      "id": "1",
      "name": "Cliente Exemplo 1",
      "analista": "Analista 1",
      "obs": "Observação exemplo"
    },
    {
      "id": "2", 
      "name": "Cliente Exemplo 2",
      "analista": "Analista 2",
      "obs": "Outra observação"
    }
  ]);
  
  let jsondemandasAnalista = JSON.parse(jsonfakeFila);

  //-----------------------globais
  const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNjMwNTIwNSwiYWFpIjoxMSwidWlkIjo2MjIwMjI3MCwiaWFkIjoiMjAyNS0wNi0xM1QyMjowODowMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE0OTc2MDksInJnbiI6InVzZTEifQ.mpfg2pNk7XeIkEV53gvNMIW0YgN0nryZo-IGHKRZ9B0";
  
  // Função para fazer requisições GraphQL usando fetch nativo
  async function request(endpoint, query, variables = {}) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  }

  //functions get
  async function getJson(etapaColumnId) {
    const BOARD_ID = 9653232918;
    const endpoint = "https://api.monday.com/v2";

    const query = `
    query {
      items_page_by_column_values(
        board_id: ${BOARD_ID},
        columns: [
          {
            column_id: "status_1",
            column_values: ["BOT"]
          },
          {
            column_id: "${etapaColumnId}",
            column_values: ["Contato Inicial"]
          }
        ]
      ) {
        items {
          id
          name
          column_values(ids: ["status_1", "${etapaColumnId}", "person", "data5"]) {
            id
            text
          }
        }
      }
    }
  `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      const items = json.data?.items_page_by_column_values?.items || [];
      return items;
    } catch (error) {
      console.error("Erro na consulta GraphQL:", error);
      return [];
    }
  }

  async function getDemandasBotExcetoContatoInicial() {
    const API_TOKEN =
      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNjMwNTIwNSwiYWFpIjoxMSwidWlkIjo2MjIwMjI3MCwiaWFkIjoiMjAyNS0wNi0xM1QyMjowODowMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE0OTc2MDksInJnbiI6InVzZTEifQ.mpfg2pNk7XeIkEV53gvNMIW0YgN0nryZo-IGHKRZ9B0";
    const BOARD_ID = 9653232918;
    const endpoint = "https://api.monday.com/v2";

    const query = `
    query {
      items_page_by_column_values(
        board_id: ${BOARD_ID},
        columns: [
          {
            column_id: "status_1",
            column_values: ["BOT"]
          }
        ]
      ) {
        items {
          id
          name
          column_values(ids: ["status_1", "status35", "person", "data5"]) {
            id
            text
          }
        }
      }
    }
  `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const json = await response.json();
      const todos = json.data?.items_page_by_column_values?.items || [];

      // Filtra os que NÃO estão em "Contato Inicial"
      const filtrados = todos.filter((item) => {
        const etapa = item.column_values.find((c) => c.id === "status35");
        return etapa?.text !== "Contato Inicial";
      });

      return filtrados;
    } catch (err) {
      console.error("Erro ao buscar demandas:", err);
      return [];
    }
  }

// ===== USO =====
// await atribuirResponsavelNoMonday(1234567890, "Nathan Paranhos da Silva");

// Uso:
// await updateResponsavel(1234567890, "paranhoscontato.ng@gmail.com");

async function updateResponsavel(itemId, emailResponsavel) {
  // === CONFIG ===
  const ENDPOINT = "https://api.monday.com/v2";
  const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNjMwNTIwNSwiYWFpIjoxMSwidWlkIjo2MjIwMjI3MCwiaWFkIjoiMjAyNS0wNi0xM1QyMjowODowMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE0OTc2MDksInJnbiI6InVzZTEifQ.mpfg2pNk7XeIkEV53gvNMIW0YgN0nryZo-IGHKRZ9B0";
  const BOARD_ID  = 9653232918;  // seu board
  const COL_ID    = "person";    // id da coluna People ("Responsável")

  const headers = {
    "Content-Type": "application/json",
    "Authorization": API_TOKEN,
    "API-version": "2023-10"
  };

  async function gql(query, variables) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables })
    });
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }

  // 1) Buscar usuário pelo e-mail (case-insensitive)
  const usersData = await gql(`
    query {
      users(limit: 500) { id name email is_guest is_pending is_view_only }
    }
  `);
  const emailKey = String(emailResponsavel).trim().toLowerCase();
  const user = (usersData.users || []).find(u =>
    (u.email || "").trim().toLowerCase() === emailKey
  );
  if (!user) throw new Error(`Usuário não encontrado pelo e-mail: "${emailResponsavel}"`);

  // 2) Garantir que o usuário é assinante do board (necessário para poder atribuir)
  //    Se já for assinante, a operação é idempotente.
  try {
    await gql(`
      mutation ($boardId: ID!, $userIds: [Int]) {
        add_subscribers_to_board(board_id: $boardId, user_ids: $userIds, kind: subscriber) { id }
      }
    `, { boardId: BOARD_ID, userIds: [Number(user.id)] });
  } catch (e) {
    // Se já é assinante ou não houve mudança, apenas seguimos
    console.warn("Aviso ao adicionar subscriber (pode já ser assinante):", e.message || e);
  }

  // (Opcional) Verifica se virou assinante mesmo
  const subs = await gql(`
    query ($id: [ID!]) {
      boards(ids: $id) { id subscribers { id email name } }
    }
  `, { id: BOARD_ID });
  const isSubscriber = (subs.boards?.[0]?.subscribers || [])
    .some(s => String(s.id) === String(user.id));
  if (!isSubscriber) {
    throw new Error(`Usuário ${user.name} (${user.email}) não é assinante do board ${BOARD_ID}.`);
  }

  // 3) Atualizar a coluna People com personsAndTeams (usa change_multiple_column_values)
  const colVals = JSON.stringify({
    [COL_ID]: { personsAndTeams: [{ id: Number(user.id), kind: "person" }] }
  });

  const upd = await gql(`
    mutation ($boardId: ID!, $itemId: ID!, $colVals: JSON!) {
      change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $colVals) { id }
    }
  `, { boardId: BOARD_ID, itemId, colVals });

  return {
    ok: true,
    itemId,
    user: { id: Number(user.id), name: user.name, email: user.email },
    api: upd
  };
}



  //funções lógicas
  async function autoQueue() {
    //ver quem tem menos demandas
    //ver quanto tempo está sem demandas
    const ETAPA_CONTATOINICIAL = "status35"; //coluna monday da etapa

    //pegando novas demandas do JSON
    console.log("|======================retornoAPI=======================|");
    const etapaColumnId = ETAPA_CONTATOINICIAL;
    const demandas = await getJson(etapaColumnId); // Espera corretamente
    let arrayNovasDemandas = trataJsonParaObj(demandas);
    let demandasExistentes = [];

    const demandasAlocadas = await getDemandasBotExcetoContatoInicial();
    demandasExistentes.push(...demandasAlocadas); // usando spread para manter como array plano
    console.log(
      "====================Demandas já alocadas========================"
    );
    console.log(demandasExistentes);
    let arrayDemandasExistentes = trataJsonParaObj(demandasExistentes);

    await geraObjetoDemandas(arrayDemandasExistentes); // na variavel listadeDemandasPorAnalista

    console.log(listadeDemandasPorAnalista);
    await defineDemandaParaAnalista(
      listadeDemandasPorAnalista,
      arrayNovasDemandas
    );
    /*
      let $tabela = document.querySelector(".js-demandas-automaticas");
    demandas.forEach((element) => {
      console.log(element.nome);
      });
      */
  }

async function defineDemandaParaAnalista(filaAnalistas, novasDemandas, { dryRun = false } = {}) {
  // analistas "oficiais"
  const analistas = [
    { Nome: "Jean Vencigueri", Email: "jean.vencigueri@fagrontech.com.br" },
    { Nome: "Nathan Paranhos da Silva", Email: "nathan.silva@fagrontech.com.br" },
  ];

  // 1) mapa de contagens (semente com fila existente)
  // ATENÇÃO: se filaAnalistas.AnalistaResponsavel vier como NOME, adapte aqui para casar com Nome (ou mude a coleta para capturar email)
  const counts = new Map(analistas.map(a => [a.Email, 0]));
  for (const f of filaAnalistas) {
    const key = f.AnalistaResponsavel; // garanta que isso seja EMAIL; se for nome, converta
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + (f.QuantidadeDemandas || 0));
  }

  // ordem fixa para desempate determinístico
  const ordem = analistas.map(a => a.Email);

  const resultados = []; // para auditoria / testes

  // 2) distribui novas demandas
  for (const demanda of novasDemandas) {
    // escolhe o menor
    let escolhidoEmail = ordem[0];
    let menor = Infinity;
    for (const email of ordem) {
      const c = counts.get(email) ?? 0;
      if (c < menor) { menor = c; escolhidoEmail = email; }
    }
    const escolhido = analistas.find(a => a.Email === escolhidoEmail);

    // 3) aplica efeitos
    if (!dryRun) {
      // se sua função atualiza por email:
      await updateResponsavel(demanda.IdDemanda, escolhido.Email);
      alert('Demandas Alocadas!')
    }

    // incrementa contagem para refletir a nova alocação
    counts.set(escolhidoEmail, (counts.get(escolhidoEmail) ?? 0) + 1);

    resultados.push({ demandaId: demanda.IdDemanda, analista: escolhido.Nome, email: escolhido.Email });
  }

  // retorno útil para logs/testes
  return {
    distribuicao: Object.fromEntries(counts), // {email: quantidade_final}
    atribuicoes: resultados
  };
}


  function trataJsonParaObj(json) {
    class OBJDemandaTratada {
      constructor(nomeCli, dataPD, idDemanda, analistaResponsavel) {
        this.NomeCliente = nomeCli;
        this.IdDemanda = idDemanda;
        this.DataPedido = dataPD;
        this.AnalistaResponsavel = analistaResponsavel;
      }
    }

    let arrayDemandas = [];

    json.forEach((elemento) => {
      const nome = elemento.name;
      const id = elemento.id;

      // Procura a coluna "data5" (pode trocar o ID se for outro)
      const dataCol = elemento.column_values.find((col) => col.id === "data5");
      const dataPedido = dataCol?.text || null;

      const analistaCol = elemento.column_values.find(
        (col2) => col2.id === "person"
      );
      const analistaDemanda = analistaCol?.text || null;

      const demanda = new OBJDemandaTratada(
        nome,
        dataPedido,
        id,
        analistaDemanda
      );
      arrayDemandas.push(demanda);
    });
    return arrayDemandas;
  }
  function addDemandaLista(Analista, demandas) {
    class DemandaPorAnalista {
      constructor(analista, demanda) {
        this.AnalistaResponsavel = analista;
        this.Demanda = demanda;
        this.QuantidadeDemandas = demandas.length;
      }
    }

    let demandaParaAdd = new DemandaPorAnalista(Analista, demandas);
    listadeDemandasPorAnalista.push(demandaParaAdd);
  }

  async function geraObjetoDemandas(novasdemandas) {
    let todosOsAnalistasNaFila = false;
    do {
      let tmpDemanda = [];

      //riando uma fila com as demandas
      let analistaAdicionado = false;
      novasdemandas.forEach((demanda1) => {
        if (listadeDemandasPorAnalista.length == 0) {
          novasdemandas.forEach((demanda2) => {
            if (demanda2.AnalistaResponsavel == demanda1.AnalistaResponsavel) {
              tmpDemanda.push(demanda2);
            }
          });

          //adiciona na lista "listadeDemandasPorAnalista" a demanda
          addDemandaLista(tmpDemanda[0].AnalistaResponsavel, tmpDemanda);
          console.log("Demanda Adicionada");
          tmpDemanda = [];
        } else {
          novasdemandas.forEach((element) => {
            //ver se já está na lista
            let estaNaFila = false;
            listadeDemandasPorAnalista.forEach((lista) => {
              if (lista.AnalistaResponsavel == element.AnalistaResponsavel) {
                estaNaFila = true;
              }
            });

            if (estaNaFila == false) {
              novasdemandas.forEach((demanda2) => {
                if (
                  demanda2.AnalistaResponsavel == element.AnalistaResponsavel
                ) {
                  tmpDemanda.push(demanda2);
                  analistaAdicionado = true;
                }
              });
              //adiciona na lista "listadeDemandasPorAnalista" a demanda
              addDemandaLista(tmpDemanda[0].AnalistaResponsavel, tmpDemanda);
              console.log("Demanda Adicionada");
              tmpDemanda = [];
            } else {
              analistaAdicionado = false;
            }
          });
        }
      });
      console.log(listadeDemandasPorAnalista);

      //Validação para sair do loop
      if (analistaAdicionado == false) {
        todosOsAnalistasNaFila = true;
      }
    } while (todosOsAnalistasNaFila == false);
  }
})();