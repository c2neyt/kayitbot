const { REST, Routes } = require('discord.js');
const token = 'MTI4OTk1Nzk3ODAyNzU4OTcyMg.GL4p5-.jSaZ7MMsMNzYr1NkuhtS3smv4CaKY49aTq2DNY';
const clientId = '1289957978027589722';
const guildId = '1285631638348501083';

const commands = [
  {
    name: 'kayıtol',
    description: 'Kayıt formu açar',
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Slash komutları Discord API\'ye yükleniyor...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Slash komutları başarıyla yüklendi.');
  } catch (error) {
    console.error('Komutlar yüklenirken hata oluştu:', error);
  }
})();
