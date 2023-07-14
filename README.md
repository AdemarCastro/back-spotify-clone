# Back-end do Spotify Clone

Este é o Back-End do projeto Spotify Clone. Para realizar o deploy do projeto, é necessário separar o Front-End e o Back-End em projetos distintos. Dessa forma, o Front-End pode se comunicar com o Back-End por meio de uma API, que é responsável pelo tratamento dos dados e pela conexão com o Banco de Dados. Essa separação permite que as duas partes da aplicação sejam desenvolvidas e testadas de forma independente, além de facilitar a escalabilidade e a manutenção do projeto. Utilizei o Clever Cloud com MySQL para desenvolver o Banco de Dados.

## Qual a razão do Back

Eu desenvolvi o Back-End desta aplicação com o objetivo de adicionar uma funcionalidade de salvar músicas favoritas. Para isso, criei uma conexão com o banco de dados e implementei a capacidade de salvar, excluir e exibir as músicas salvas em minha aplicação.

No Front-End, adicionei um botão de "coração" ao lado das músicas exibidas, utilizando a API do Spotify para obter as informações. Ao clicar no botão, a música é salva em meu banco de dados e, posteriormente, pode ser acessada na aba de "favoritos".

O botão é interativo e muda de cor para indicar se a música já foi salva ou não. Se a música já estiver salva em meu banco, o botão fica verde. Caso contrário, ele fica cinza.

---

Desenvolvido por Ademar Castro.

