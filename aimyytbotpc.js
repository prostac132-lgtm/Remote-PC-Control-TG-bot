const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const screenshot = require('screenshot-desktop');

// Учетные данные и прокси
const token = 'токен бота';
const adminId = айдипользователя;
const startTime = Math.floor(Date.now() / 1000);

if (!token || isNaN(adminId)) {
    console.error("Ошибка: Токен или ADMIN_ID не установлены.");
    process.exit(1);
}

const bot = new TelegramBot(token, { 
    polling: true,
    request: {
        proxy: 'http://пароль:логин@айпи:порт'
    } 
});

// Защита доступа
const checkAccessText = (msg) => {
    if (msg.from.id !== adminId) return false;
    if (msg.date < startTime) return false;
    return true;
};

const checkAccessCallback = (query) => {
    if (query.from.id !== adminId) {
        bot.answerCallbackQuery(query.id, { text: "Доступ запрещен!", show_alert: true });
        return false;
    }
    if (query.message.date < startTime) {
        bot.answerCallbackQuery(query.id, { text: "⚠️ Эта панель устарела. Откройте меню заново.", show_alert: true });
        return false;
    }
    return true;
};

// Главная клавиатура
const mainMenu = {
    reply_markup: {
        keyboard: [
            ['📸 Скриншот', '💤 Спящий режим'],
            ['🔄 Перезагрузка', '❌ Выключение'],
            ['▶️ Управление программами ◀️'],
            ['📡 Сеть и Блокировки 📡', '🎤 Микрофон 🎤'],
            ['🔊 Управление громкостью 🔊', '📊 Статистика ПК 📊']
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

// Скрипт для получения статистики
const psStatsCmd = `powershell -Command "$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average; $os = Get-CimInstance Win32_OperatingSystem; $free = [math]::Round($os.FreePhysicalMemory/1048576, 1); $total = [math]::Round($os.TotalVisibleMemorySize/1048576, 1); Write-Output \\"$cpu|$free|$total\\""`;

// ---------------- ТЕКСТОВЫЕ КОМАНДЫ ----------------

bot.onText(/\/start/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "⚡️ **Инлайн-панель ПК активирована!**\nВыберите категорию:", { parse_mode: "Markdown", ...mainMenu });
});

bot.onText(/📸 Скриншот/, async (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "📸 Делаю снимок экрана...");
    try {
        const img = await screenshot();
        bot.sendPhoto(msg.chat.id, img);
    } catch (error) {
        bot.sendMessage(msg.chat.id, "⚠️ Ошибка при создании скриншота: " + error.message);
    }
});

bot.onText(/💤 Спящий режим/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "🌙 Перевожу ПК в спящий режим...");
    exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
});

bot.onText(/🔄 Перезагрузка/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "🔄 ПК уходит в перезагрузку...");
    exec('shutdown /r /t 0');
});

bot.onText(/❌ Выключение/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "🛑 ПК выключается...");
    exec('shutdown /s /t 0');
});

bot.onText(/📡 Сеть и Блокировки 📡/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "📡 **Панель управления сетью:**", {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔽 Общий Интернет 🔽', callback_data: 'ignore' }],
                [{ text: '🔌 Отключить', callback_data: 'net_off' }, { text: '🔋 Включить', callback_data: 'net_on' }],
                [{ text: '🔽 Блокировка программ 🔽', callback_data: 'ignore' }],
                [{ text: '🚫 Блок. Chrome', callback_data: 'block_chrome' }, { text: '🌐 Разблок. Chrome', callback_data: 'unblock_chrome' }],
                [{ text: '🚫 Блок. Minecraft', callback_data: 'block_javaw' }, { text: '🌐 Разблок. Minecraft', callback_data: 'unblock_javaw' }]
            ]
        }
    });
});

bot.onText(/🎤 Микрофон 🎤/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "🎙 **Управление микрофоном:**", {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔇 Отключить микрофон', callback_data: 'mic_off' }],
                [{ text: '🔊 Включить микрофон', callback_data: 'mic_on' }]
            ]
        }
    });
});

bot.onText(/🔊 Управление громкостью 🔊/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "🔊 **Настройка громкости ПК:**", {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔇 0%', callback_data: 'vol_0' }, { text: '🔉 25%', callback_data: 'vol_25' }],
                [{ text: '🔉 50%', callback_data: 'vol_50' }, { text: '🔊 75%', callback_data: 'vol_75' }],
                [{ text: '🔊 100%', callback_data: 'vol_100' }]
            ]
        }
    });
});

bot.onText(/📊 Статистика ПК 📊/, (msg) => {
    if (!checkAccessText(msg)) return;
    exec(psStatsCmd, (error, stdout) => {
        if (error) return bot.sendMessage(msg.chat.id, "⚠️ Ошибка получения статистики.");
        const [cpu, free, total] = stdout.trim().split('|');
        const used = (total - free).toFixed(1);
        bot.sendMessage(msg.chat.id, `📊 **Текущая нагрузка:**\n\n🧠 **CPU:** ${cpu}%\n💾 **RAM:** ${used} GB / ${total} GB (Свободно: ${free} GB)`, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: '🔄 Обновить', callback_data: 'update_stats' }]] }
        });
    });
});

bot.onText(/▶️ Управление программами ◀️/, (msg) => {
    if (!checkAccessText(msg)) return;
    bot.sendMessage(msg.chat.id, "⏳ Сканирую рабочий стол...");
    exec('powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object -Unique Name | Select-Object -ExpandProperty Name"', (error, stdout) => {
        if (error) return bot.sendMessage(msg.chat.id, "⚠️ Ошибка получения процессов.");
        
        const ignoreList = ['ApplicationFrameHost', 'TextInputHost', 'SystemSettings', 'explorer'];
        const processes = stdout.trim().split('\n').map(p => p.trim()).filter(p => p && !ignoreList.includes(p));
        
        if (processes.length === 0) return bot.sendMessage(msg.chat.id, "👀 На рабочем столе нет открытых окон.");

        const inlineKeyboard = [];
        for (let i = 0; i < Math.min(processes.length, 20); i += 2) {
            const row = [];
            row.push({ text: `❌ ${processes[i]}`, callback_data: `kill_${processes[i]}` });
            if (processes[i+1]) row.push({ text: `❌ ${processes[i+1]}`, callback_data: `kill_${processes[i+1]}` });
            inlineKeyboard.push(row);
        }
        
        bot.sendMessage(msg.chat.id, "⬇️ **Выберите процесс для завершения:**", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: inlineKeyboard }
        });
    });
});

// ---------------- ОБРАБОТЧИК ИНЛАЙН-КНОПОК ----------------

bot.on('callback_query', (query) => {
    const msg = query.message;
    if (!checkAccessCallback(query)) return;
    const data = query.data;

    if (data === 'ignore') return bot.answerCallbackQuery(query.id);

    // Завершение процессов
    if (data.startsWith('kill_')) {
        const proc = data.replace('kill_', '');
        exec(`taskkill /IM "${proc}.exe" /F`, (error) => {
            if (error) bot.answerCallbackQuery(query.id, { text: `⚠️ ${proc} не найден.` });
            else {
                bot.answerCallbackQuery(query.id, { text: `✅ ${proc} закрыт!` });
                bot.sendMessage(msg.chat.id, `✅ Программа **${proc}** завершена.`, { parse_mode: "Markdown" });
            }
        });
    }
    // Сеть
    else if (data === 'net_off') {
        exec('powershell -Command "Disable-NetAdapter -Name \'Сеть\' -Confirm:$false"');
        bot.answerCallbackQuery(query.id, { text: "⏳ Отключаю Интернет..." });
    }
    else if (data === 'net_on') {
        exec('powershell -Command "Enable-NetAdapter -Name \'Сеть\' -Confirm:$false"');
        bot.answerCallbackQuery(query.id, { text: "⏳ Включаю Интернет..." });
    }
    // Микрофон
    else if (data === 'mic_off') {
        exec('powershell -Command "Get-PnpDevice | Where-Object {$_.FriendlyName -match \'ME6S\'} | Disable-PnpDevice -Confirm:$false"');
        bot.answerCallbackQuery(query.id, { text: "⏳ Отключаю микрофон..." });
    }
    else if (data === 'mic_on') {
        exec('powershell -Command "Get-PnpDevice | Where-Object {$_.FriendlyName -match \'ME6S\'} | Enable-PnpDevice -Confirm:$false"');
        bot.answerCallbackQuery(query.id, { text: "⏳ Включаю микрофон..." });
    }
    // Брандмауэр
    else if (data === 'block_chrome') {
        exec(`powershell -Command "$p = (Get-Process -Name 'chrome' -ErrorAction SilentlyContinue | Select-Object -First 1).Path; if ($p) { New-NetFirewallRule -DisplayName 'BotBlock_chrome' -Direction Outbound -Program $p -Action Block -ErrorAction SilentlyContinue }"`);
        bot.answerCallbackQuery(query.id, { text: "⏳ Блокирую Chrome..." });
    }
    else if (data === 'unblock_chrome') {
        exec(`powershell -Command "Remove-NetFirewallRule -DisplayName 'BotBlock_chrome' -ErrorAction SilentlyContinue"`);
        bot.answerCallbackQuery(query.id, { text: "⏳ Разблокирую Chrome..." });
    }
    else if (data === 'block_javaw') {
        exec(`powershell -Command "$p = (Get-Process -Name 'javaw' -ErrorAction SilentlyContinue | Select-Object -First 1).Path; if ($p) { New-NetFirewallRule -DisplayName 'BotBlock_javaw' -Direction Outbound -Program $p -Action Block -ErrorAction SilentlyContinue }"`);
        bot.answerCallbackQuery(query.id, { text: "⏳ Блокирую Minecraft..." });
    }
    else if (data === 'unblock_javaw') {
        exec(`powershell -Command "Remove-NetFirewallRule -DisplayName 'BotBlock_javaw' -ErrorAction SilentlyContinue"`);
        bot.answerCallbackQuery(query.id, { text: "⏳ Разблокирую Minecraft..." });
    }
    // Громкость
    else if (data.startsWith('vol_')) {
        const vol = parseInt(data.split('_')[1]);
        const upClicks = Math.ceil(vol / 2);
        const psCmd = `$w = New-Object -ComObject wscript.shell; 1..50 | % { $w.SendKeys([char]174) }; if (${upClicks} -gt 0) { 1..${upClicks} | % { $w.SendKeys([char]175) } }`;
        exec(`powershell -Command "${psCmd}"`);
        bot.answerCallbackQuery(query.id, { text: `🔊 Громкость установлена на ${vol}%` });
    }
    // Обновление статистики
    else if (data === 'update_stats') {
        exec(psStatsCmd, (error, stdout) => {
            if (error) return bot.answerCallbackQuery(query.id, { text: "Ошибка обновления" });
            const [cpu, free, total] = stdout.trim().split('|');
            const used = (total - free).toFixed(1);
            const newText = `📊 **Текущая нагрузка:**\n\n🧠 **CPU:** ${cpu}%\n💾 **RAM:** ${used} GB / ${total} GB (Свободно: ${free} GB)`;
            
            bot.editMessageText(newText, {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: '🔄 Обновить', callback_data: 'update_stats' }]] }
            }).catch(() => {});
            
            bot.answerCallbackQuery(query.id, { text: "✅ Обновлено!" });
        });
    }
});

console.log("=========================================");
console.log("✅ Финальный бот запущен и готов к работе!");
console.log("=========================================");