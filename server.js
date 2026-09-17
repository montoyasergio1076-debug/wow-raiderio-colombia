const express = require('express');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const app = express();

// Configurar la carpeta donde se guardarán temporalmente los logs
const upload = multer({ dest: 'uploads/' });

// Servir la página web desde la carpeta 'public'
app.use(express.static('public'));

// Jefes principales de la versión 4.3.4 (Alma de Dragón - Dragon Soul)
const CATACLYSM_BOSSES = [
    "Morchok", 
    "Zon'ozz", 
    "Yor'sahj", 
    "Hagara", 
    "Ultraxion", 
    "Blackhorn", 
    "Spine of Deathwing", 
    "Madness of Deathwing"
];

// Ruta para procesar la subida del archivo WoWCombatLog.txt
app.post('/upload-log', upload.single('combatlog'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No seleccionaste ningún archivo.' });
    }

    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let bossKills = [];

    // Leer el archivo de texto línea por línea para no agotar la memoria
    rl.on('line', (line) => {
        if (line.includes('UNIT_DIED')) {
            CATACLYSM_BOSSES.forEach(boss => {
                if (line.includes(boss)) {
                    const hora = line.split('  ')[0];
                    bossKills.push({ jefe: boss, hora: hora });
                }
            });
        }
    });

    rl.on('close', () => {
        // Borrar el archivo cargado para no llenar el disco duro
        fs.unlink(filePath, () => {});
        res.json({ success: true, bossesDerrotados: bossKills });
    });
});

// Activar el servidor en el puerto por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`¡Servidor listo en el puerto ${PORT}!`);
});