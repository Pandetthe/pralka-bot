const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const config = require('./config.json');

function timer(ms) { return new Promise(res => setTimeout(res, ms)); }

const command = new SlashCommandBuilder()
  .setName('wypierz')
  .setDescription('Wybije ci z głowy nawet najbardziej zboczone myśli!')
  .addUserOption(option =>
    option.setName('osoba')
      .setDescription('Oznacz osobę, której myśli chcesz oczyścić')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('ilość')
      .setDescription('Ilość obrotów bębna')
      .setRequired(true));

const rest = new REST({ version: '9' }).setToken(config.token);
try {
  console.log('Wczytywanie komendy.');
  rest.put(
    Routes.applicationGuildCommands(config.clientID, config.guildID),
    { body: [command] },
  );
  console.log('Pomyślnie wczytano komendę.');
} catch (error) {
  console.error(error);
}

client.on('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'wypierz') return;
  const member = interaction.options.getMember('osoba');
  if (member.user.bot) {
    await interaction.reply('Nie wolno prać bota!');
    return;
  }
  const amount = interaction.options.getInteger('ilość');
  if (amount > 250 || amount <= 0) {
    await interaction.reply('Niepoprawna liczba obrotów bębnem!');
    return;
  }
  await interaction.reply('Rozpoczynamy proces prania!');
  const upperChannel = interaction.guild.channels.cache.find(channel => channel.id == config.upperChannelID)
  if (!upperChannel) {
    await interaction.followUp('Brakuje górnej części pralki!');
    return;
  }
  const lowerChannel = interaction.guild.channels.cache.find(channel => channel.id == config.lowerChannelID);
  if (!lowerChannel) {
    await interaction.followUp('Brakuje dolnej części pralki!');
    return;
  }
  const actualChannel = member.voice.channel;
  if (!actualChannel) {
    await interaction.followUp('Wskazana osoba nie jest na kanale głosowym!');
    return;
  }
  for (let i = 0; i < amount; i++) {
    try {
      await member.voice.setChannel(upperChannel);
      await timer(10);
      await member.voice.setChannel(lowerChannel);
      await timer(10);
    } catch (err) { }
  }
  try {
    await member.voice.setChannel(actualChannel);
  } catch (err) { }
  await interaction.followUp('Zakończono proces prania!');
});

client.login(config.token);