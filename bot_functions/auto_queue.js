(function(){
    let $buttonBotAutoQueue = document.getElementById('js-bot-autoQueue');

    $buttonBotAutoQueue.addEventListener('click', autoQueue);


    let jsonfake = `[
  {
    "nome": "Carlos Andrade",
    "codigo": "A1023",
    "data_solicitacao": "2025-07-15"
  },
  {
    "nome": "Fernanda Lima",
    "codigo": "B2045",
    "data_solicitacao": "2025-07-16"
  },
  {
    "nome": "João Pedro Silva",
    "codigo": "C3098",
    "data_solicitacao": "2025-07-14"
  },
  {
    "nome": "Mariana Torres",
    "codigo": "D4012",
    "data_solicitacao": "2025-07-17"
  },
  {
    "nome": "Rafael Almeida",
    "codigo": "E5127",
    "data_solicitacao": "2025-07-13"
  }
]`

    function autoQueue(){
        const CARGA_HORARIA_ANALISTA_MES = 176;
        const CARGA_HORARIA_ESTAGIARIO_MES = 140
        const HORAS_CONFIGURAÇÃO_BOT = 2

        let demandas = JSON.parse(jsonfake);
        demandas.forEach(element => {
            console.log(element.nome)
        });

    }

}());