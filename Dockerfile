# roda tudo que o node necessita pra rodar.
FROM node:20

# cd /app
WORKDIR /app

# copia tudo dos packages.json dentro da pasta /app
COPY package*.json ./

# roda npm install no terminal
RUN npm install 

# Copia todos os arquivos que tão aqui e joga no app do container. 
COPY . . 

# qual porta o container pode expor. 
EXPOSE 3000

# Comando que roda assim que a a imagem é feita. 
CMD ["npm", "start"]

# docker build - transactions-api .
# constrói uma imagem, de nome "transactions-api" e pega o diretório que ta na pasta que você esta rodando o comando. 

