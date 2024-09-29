const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs'); // Dosya işlemleri için fs modülü
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Yetkili başına kayıt sayılarını tutacağımız dosya
const kayıtDosyası = './yetkiliKayıtları.json';

// Yetkili kayıtlarını dosyadan okumak
let yetkiliKayıtları = {};
if (fs.existsSync(kayıtDosyası)) {
  const data = fs.readFileSync(kayıtDosyası, 'utf8');
  yetkiliKayıtları = JSON.parse(data);
} else {
  fs.writeFileSync(kayıtDosyası, JSON.stringify(yetkiliKayıtları));
}

// Yetkili kayıtlarını dosyaya kaydetme fonksiyonu
function kayıtlarıGüncelle() {
  fs.writeFileSync(kayıtDosyası, JSON.stringify(yetkiliKayıtları, null, 2));
}

client.once('ready', () => {
  console.log('Bot is ready!');
});

// Her şeyi büyük harfe dönüştürme fonksiyonu
function toUpperCaseAll(str) {
  return str.toUpperCase(); // Tüm harfleri büyük yap
}

// Kullanıcının Discord'a kayıt olduğu tarihi düzgün bir formatta döndürme
function formatJoinDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Aylar 0'dan başlar, bu yüzden 1 ekliyoruz
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Kanal ID'sini buraya yazın
const kayıtSohbetKanalId = '1285931882298478643'; // Buraya sohbet kanalının ID'sini yazın

// Slash komutları
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'kayıtol') {
      // Modal oluşturuluyor
      const modal = new ModalBuilder()
        .setCustomId('kayıtModal')
        .setTitle('Kayıt Formu');

      // İsim girişi
      const isimInput = new TextInputBuilder()
        .setCustomId('isimInput')
        .setLabel('İsim:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      // Soyisim girişi
      const soyisimInput = new TextInputBuilder()
        .setCustomId('soyisimInput')
        .setLabel('Soyisim:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      // Yaş girişi
      const yasInput = new TextInputBuilder()
        .setCustomId('yasInput')
        .setLabel('Yaş:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      // Mevki girişi
      const mevkiInput = new TextInputBuilder()
        .setCustomId('mevkiInput')
        .setLabel('Mevki:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      // Modal'a text inputları ekle
      const actionRow1 = new ActionRowBuilder().addComponents(isimInput);
      const actionRow2 = new ActionRowBuilder().addComponents(soyisimInput);
      const actionRow3 = new ActionRowBuilder().addComponents(yasInput);
      const actionRow4 = new ActionRowBuilder().addComponents(mevkiInput);

      // Modal'a satırları ekle
      modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

      // Modal'ı tetikle
      await interaction.showModal(modal);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'kayıtModal') {
      // Modal verilerini al ve büyük harfe çevir
      const isim = toUpperCaseAll(interaction.fields.getTextInputValue('isimInput'));
      const soyisim = toUpperCaseAll(interaction.fields.getTextInputValue('soyisimInput'));
      const yas = toUpperCaseAll(interaction.fields.getTextInputValue('yasInput'));
      const mevki = toUpperCaseAll(interaction.fields.getTextInputValue('mevkiInput'));

      // Kullanıcının Discord'a katılma tarihi
      const joinDate = formatJoinDate(interaction.member.user.createdAt);

      // Kayıt formunu embed olarak gönderiyoruz
      const kayıtBilgileriEmbed = new EmbedBuilder()
        .setTitle('Yeni Kayıt Başvurusu')
        .addFields(
          { name: 'İsim', value: isim },
          { name: 'Soyisim', value: soyisim },
          { name: 'Yaş', value: yas },
          { name: 'Mevki', value: mevki },
          { name: 'Başvuran Kullanıcı', value: `<@${interaction.user.id}>` },
          { name: 'Discord\'a Katılma Tarihi', value: joinDate } // Kullanıcının Discord'a katılma tarihi
        )
        .setColor(0x00AE86);

      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('onayla')
            .setLabel('Evet')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('reddet')
            .setLabel('Hayır')
            .setStyle(ButtonStyle.Danger),
        );

      const kayıtKanalı = interaction.guild.channels.cache.get(kayıtSohbetKanalId); // Kanalı ID ile buluyoruz
      if (kayıtKanalı) {
        await kayıtKanalı.send({ 
          embeds: [kayıtBilgileriEmbed], 
          components: [actionRow]
        });
        await interaction.reply({ content: 'Kayıt formunuz başarıyla gönderildi!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Kayıt kanalı bulunamadı!', ephemeral: true });
      }
    }
  } else if (interaction.isButton()) {
    // Başvuran kullanıcının ID'sini içerikten alıyoruz
    const başvuranId = interaction.message.embeds[0].fields.find(field => field.name === 'Başvuran Kullanıcı').value.match(/<@(\d+)>/)[1];
    const member = interaction.guild.members.cache.get(başvuranId);

    // "Kayıt Yetkilisi" rolüne sahip olup olmadığını kontrol et
    const kayıtYetkilisiRolü = interaction.guild.roles.cache.find(role => role.name === 'Kayıt Yetkilisi');
    if (!interaction.member.roles.cache.has(kayıtYetkilisiRolü.id)) {
      await interaction.reply({ content: 'Bu işlemi gerçekleştirmek için yetkiniz yok.', ephemeral: true });
      return; // Eğer yetkisi yoksa işlem iptal edilsin
    }

    try {
      // Etkileşim yanıtını geciktir
      await interaction.deferReply();

      if (interaction.customId === 'onayla') {
        const message = interaction.message.embeds[0];
        const isim = message.fields[0].value;
        const soyisim = message.fields[1].value;
        const yas = message.fields[2].value;
        const mevki = message.fields[3].value;
        const yeniIsim = `${isim} ${soyisim} | ${yas} | ${mevki}`;

        // Yetkiliyi alıyoruz
        const yetkiliId = interaction.user.id;
        const yetkili = interaction.guild.members.cache.get(yetkiliId);

        if (!yetkiliKayıtları[yetkiliId]) {
          yetkiliKayıtları[yetkiliId] = { isim: yetkili.user.tag, kayıtSayısı: 0 };
        }

        // Yetkilinin kayıt sayısını artırıyoruz
        yetkiliKayıtları[yetkiliId].kayıtSayısı += 1;
        kayıtlarıGüncelle(); // Dosyaya kaydediyoruz

        if (member) {
          try {
            // Kullanıcıya rol eklemeye çalışıyoruz
            const kayıtlıRol = interaction.guild.roles.cache.find(r => r.name === 'Kayıtlı');
            const kayıtsızRol = interaction.guild.roles.cache.find(r => r.name === 'Kayıtsız');

            if (kayıtlıRol) {
              await member.roles.add(kayıtlıRol); // "Kayıtlı" rolünü ekle
              console.log(`${member.user.tag}'a ${kayıtlıRol.name} rolü başarıyla verildi.`);
            }

            if (kayıtsızRol) {
              await member.roles.remove(kayıtsızRol); // "Kayıtsız" rolünü kaldır
              console.log(`${member.user.tag}'dan ${kayıtsızRol.name} rolü başarıyla kaldırıldı.`);
            }
          } catch (error) {
            if (error.code === 50013) { // DiscordAPIError: Missing Permissions
              console.error("Botun rol verme veya kaldırma yetkisi yok.");
              await interaction.followUp({ content: 'Bu kullanıcıya rol veremiyorum veya kaldıramıyorum, yetkim yok veya hiyerarşi sorunu var.', ephemeral: true });
            } else {
              console.error("Rol eklerken veya kaldırırken başka bir hata oluştu:", error);
              await interaction.followUp({ content: 'Rol işlemi sırasında bir hata oluştu.', ephemeral: true });
            }
          }

          // Adı değiştirme yetkisiyle ilgili benzer bir kontrol ekleyebiliriz:
          try {
            await member.setNickname(yeniIsim); // Kullanıcı adını değiştirme işlemi
            console.log(`${member.user.tag}'in adı ${yeniIsim} olarak değiştirildi.`);
            await interaction.editReply({ content: 'Başvuru onaylandı ve kullanıcıya rol verildi, kayıtsız rolü kaldırıldı!', components: [] });
          } catch (error) {
            if (error.code === 50013) { // DiscordAPIError: Missing Permissions
              console.error("Botun kullanıcı adını değiştirme yetkisi yok.");
              await interaction.followUp({ content: 'Bu kullanıcının adını değiştiremedim, yetkim yok veya hiyerarşi sorunu var.', ephemeral: true });
            } else {
              console.error("Ad değiştirirken başka bir hata oluştu:", error);
              await interaction.followUp({ content: 'Ad değiştirme işlemi sırasında bir hata oluştu.', ephemeral: true });
            }
          }

          // Kayıt sohbet kanalına embed olarak gönderelim
          const kayıtSohbetKanalı = interaction.guild.channels.cache.get(kayıtSohbetKanalId); // Kanalı ID ile buluyoruz

          if (!kayıtSohbetKanalı) {
            console.log("Kayıt sohbet kanalı bulunamadı.");
            await interaction.followUp({ content: 'Kayıt sohbet kanalı bulunamadı!', ephemeral: true });
            return; // Kanal yoksa devam etmeyelim
          }

          // Embed Gönderme Hatasını Yakalama
          try {
            const kayıtEmbed = new EmbedBuilder()
              .setTitle('Kayıt Onaylandı')
              .setDescription(`Kayıt onaylandı! ${isim} ${soyisim} adlı kullanıcı, ${mevki} mevki ile onaylandı.`)
              .addFields(
                { name: 'Son Kayıt Edilen Kullanıcı', value: `${isim} ${soyisim}` },
                { name: 'Onaylayan Yetkili', value: `<@${yetkiliId}>` }, // Yetkiliyi etiketliyoruz
                { name: 'Yetkilinin Toplam Kayıt Sayısı', value: `${yetkiliKayıtları[yetkiliId].kayıtSayısı}` }
              )
              .setColor(0x00FF00);

            console.log("Kayıt sohbet embed'i gönderiliyor...");
            await kayıtSohbetKanalı.send({ embeds: [kayıtEmbed] });
            console.log("Kayıt sohbet embed'i başarıyla gönderildi!");

          } catch (error) {
            console.error("Embed gönderilemedi:", error);
            await interaction.followUp({ content: 'Embed gönderilemedi!', ephemeral: true });
          }
        } else {
          await interaction.editReply({ content: 'Kullanıcı bulunamadı!', components: [] });
        }
      } else if (interaction.customId === 'reddet') {
        // Reddedildiğinde herkese açık embed gönderelim
        const reddetmeEmbed = new EmbedBuilder()
          .setTitle('Başvuru Reddedildi')
          .setDescription(`Başvuru reddedildi! <@${başvuranId}> adlı kullanıcının başvurusu, <@${interaction.user.id}> tarafından reddedildi.`)
          .setColor(0xFF0000);

        // Embed'i kayıt sohbet kanalına gönderelim
        const kayıtSohbetKanalı = interaction.guild.channels.cache.get(kayıtSohbetKanalId); // Kanalı ID ile buluyoruz
        if (!kayıtSohbetKanalı) {
          console.log("Kayıt sohbet kanalı bulunamadı.");
          await interaction.followUp({ content: 'Kayıt sohbet kanalı bulunamadı!', ephemeral: true });
          return;
        }

        try {
          await kayıtSohbetKanalı.send({ embeds: [reddetmeEmbed] });
          await interaction.editReply({ content: 'Başvuru reddedildi.', components: [] });
        } catch (error) {
          console.error("Reddetme embed'i gönderilemedi:", error);
          await interaction.followUp({ content: 'Embed gönderilemedi!', ephemeral: true });
        }
      }
    } catch (error) {
      console.error("Etkileşim işlenirken hata oluştu:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }
  }
});

// Global hata yakalama
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login('MTI4OTk1Nzk3ODAyNzU4OTcyMg.GL4p5-.jSaZ7MMsMNzYr1NkuhtS3smv4CaKY49aTq2DNY'); // Bot token'inizi buraya ekleyin
