(function () {
  let $buttonBotAutoQueue = document.getElementById("js-bot-autoQueue");

  $buttonBotAutoQueue.addEventListener("click", autoQueue);
  let jsonfakeDemandas = `[
  {
    "nome": "Carlos Andrade",
    "codigo": "A1023",
    "data_solicitacao": "2025-07-15",
    "analista_responsavel": "Ana Paula"
  },
  {
    "nome": "Fernanda Lima",
    "codigo": "B2045",
    "data_solicitacao": "2025-07-16",
    "analista_responsavel": "Bruno Vaz"
  },
  {
    "nome": "João Pedro Silva",
    "codigo": "C3098",
    "data_solicitacao": "2025-07-14",
    "analista_responsavel": "Pedro Ribeiro"
  },
  {
    "nome": "Mariana Torres",
    "codigo": "D4012",
    "data_solicitacao": "2025-07-17",
    "analista_responsavel": "Bruno Vaz"
  },
  {
    "nome": "Rafael Almeida",
    "codigo": "E5127",
    "data_solicitacao": "2025-07-13",
    "analista_responsavel": "Ana Paula"
  }
]`;

  let jsonfakeFila = `[
  {
    "nome": "Carlos Andrade",
    "codigo": "A1023",
    "data_solicitacao": "2025-07-15",
    "analista_responsavel": "Ana Paula"
  },
  {
    "nome": "Fernanda Lima",
    "codigo": "B2045",
    "data_solicitacao": "2025-07-16",
    "analista_responsavel": "Bruno Vaz"
  },
  {
    "nome": "João Pedro Silva",
    "codigo": "C3098",
    "data_solicitacao": "2025-07-14",
    "analista_responsavel": "Pedro Ribeiro"
  },
  {
    "nome": "Mariana Torres",
    "codigo": "D4012",
    "data_solicitacao": "2025-07-17",
    "analista_responsavel": "Bruno Vaz"
  },
  {
    "nome": "Rafael Almeida",
    "codigo": "E5127",
    "data_solicitacao": "2025-07-13",
    "analista_responsavel": "Ana Paula"
  }
]`;

  function autoQueue() {
    const CARGA_HORARIA_ANALISTA_MES = 176;
    const CARGA_HORARIA_ESTAGIARIO_MES = 140;
    const HORAS_CONFIGURAÇÃO_BOT = 2;

    // const DemandaAnalista = {
    //   Analista: String,
    //   Demanda: {},
    // };
    let novasDmandas = JSON.parse(jsonfakeDemandas);
    let jsondemandasAnalista = JSON.parse(jsonfakeFila);

    class DemandaPorAnalista {
      constructor(analista, demanda) {
        this.AnalistaResponsavel = analista;
        this.Demanda = demanda;
      }
    }

    let listadeDemandasPorAnalista = [];
    let todosOsAnalistasNaFila = false;
    do {
      let tmpDemanda = [];

      //riando uma fila com as demandas
      let analistaAdicionado = false;
      novasDmandas.forEach((demanda1) => {
        if (listadeDemandasPorAnalista.length == 0) {
          novasDmandas.forEach((demanda2) => {
            if (
              demanda2.analista_responsavel == demanda1.analista_responsavel
            ) {
              tmpDemanda.push(demanda2);
            }
          });
        } else {
          debugger;
          novasDmandas.forEach((element) => {
            //ver se já está na lista
            let estaNaFila = false;
            listadeDemandasPorAnalista.forEach((lista) => {
              if (lista.AnalistaResponsavel == element.analista_responsavel) {
                estaNaFila = true;
              }
            });

            if (!(estaNaFila == true)) {
              if (
                !(element.analista_responsavel == demanda1.analista_responsavel)
              ) {
                novasDmandas.forEach((demanda2) => {
                  if (demanda2.analista_responsavel == demanda1.analista_responsavel) {
                    tmpDemanda.push(demanda2);
                  }
                });
              } else {
                analistaAdicionado = false;
              }
            }
          });
        }

        //----------------------------------
        console.log("saiu do loop");
        let demandaParaAdd = new DemandaPorAnalista(
          tmpDemanda[0].analista_responsavel,
          tmpDemanda
        );

        listadeDemandasPorAnalista.push(demandaParaAdd);

        console.log("Demanda Adicionada");

        demandaParaAdd = null;
      });

      console.log(listadeDemandasPorAnalista);

      //Validação para sair do loop
      if ((analistaAdicionado = false)) {
        todosOsAnalistasNaFila = true;
      }
    } while (todosOsAnalistasNaFila == false);

    let $tabela = document.querySelector(".js-demandas-automaticas");
    let demandas = JSON.parse(jsonfakeDemandas);
    demandas.forEach((element) => {
      console.log(element.nome);
    });
  }
})();
