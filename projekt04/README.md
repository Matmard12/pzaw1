sklonować z githuba 

-------------------------------------------------------

nastepnie W PRZYPADKU KORZYSTANIA Z WINDOWS stworzyć plik .env w którym ma się znajdować:

PORT=8000
SECRET=""
PEPPER=""

wpisz komendę dwukrotnie i pierwszy wynik wklej do sekcji secret a drugi do sekcji pepper:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

--------------------------------------------------------

w przypadku linuux/mac/git bash użyj komendy:
bash utils/generate_env.sh > .env

--------------------------------------------------------

później w terminalu wpisać komendę npm install a potem npm start

Należy również zmienić hasło do automatycznie stworzonych kont w user.js:
admin changeme 
user1 changeme