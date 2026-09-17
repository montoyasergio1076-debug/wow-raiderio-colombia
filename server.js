const express = require('express');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const app = express();

const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));

// Mapeo completo de las 10 Clases y sus 3 Ramas para Cataclismo 4.3.4
const SPELL_MAPPING = {
    // GUERRERO
    "Mortal Strike": { clase: "Guerrero", rama: "Armas", rol: "DPS" },
    "Golpe mortal": { clase: "Guerrero", rama: "Armas", rol: "DPS" },
    "Sed de sangre": { clase: "Guerrero", rama: "Furia", rol: "DPS" },
    "Embate con escudo": { clase: "Guerrero", rama: "Protección", rol: "Tanque" },

    // PALADÍN
    "Luz sagrada": { clase: "Paladín", rama: "Sagrado", rol: "Healer" },
    "Choque de Luz": { clase: "Paladín", rama: "Sagrado", rol: "Healer" },
    "Veredicto del templario": { clase: "Paladín", rama: "Reprensión", rol: "DPS" },
    "Escudo del honrado": { clase: "Paladín", rama: "Protección", rol: "Tanque" },

    // CAZADOR
    "Matar": { clase: "Cazador", rama: "Dominio de bestias", rol: "DPS" },
    "Disparo de quimera": { clase: "Cazador", rama: "Puntería", rol: "DPS" },
    "Disparo explosivo": { clase: "Cazador", rama: "Supervivencia", rol: "DPS" },

    // PICARO
    "Paso de las sombras": { clase: "Pícaro", rama: "Sutileza", rol: "DPS" },
    "Asesinar": { clase: "Pícaro", rama: "Asesinato", rol: "DPS" },
    "Aluvión de acero": { clase: "Pícaro", rama: "Combate", rol: "DPS" },

    // SACERDOTE
    "Penitencia": { clase: "Sacerdote", rama: "Disciplina", rol: "Healer" },
    "Palabra sagrada: Santuario": { clase: "Sacerdote", rama: "Sagrado", rol: "Healer" },
    "Tortura mental": { clase: "Sacerdote", rama: "Sombra", rol: "DPS" },

    // CABALLERO DE LA MUERTE (DK)
    "Golpe al corazón": { clase: "DK", rama: "Sangre", rol: "Tanque" },
    "Asolar": { clase: "DK", rama: "Escarcha", rol: "DPS" },
    "Golpe de la plaga": { clase: "DK", rama: "Profano", rol: "DPS" },

    // CHAMÁN
    "Ráfaga de lava": { clase: "Chamán", rama: "Elemental", rol: "DPS" },
    "Golpe de tormenta": { clase: "Chamán", rama: "Mejora", rol: "DPS" },
    "Ola de sanación": { clase: "Chamán", rama: "Restauración", rol: "Healer" },
    "Lluvia de sanación": { clase: "Chamán", rama: "Restauración", rol: "Healer" },

    // MAGO
    "Explosión de Arcano": { clase: "Mago", rama: "Arcano", rol: "DPS" },
    "Piroexplosión": { clase: "Mago", rama: "Fuego", rol: "DPS" },
    "Lanza de Escarcha": { clase: "Mago", rama: "Escarcha", rol: "DPS" },

    // BRUJO
    "Inestabilidad": { clase: "Brujo", rama: "Aflicción", rol: "DPS" },
    "Metamorfosis": { clase: "Brujo", rama: "Demonología", rol: "DPS" },
    "Conflagrar": { clase: "Brujo", rama: "Destrucción", rol: "DPS" },

    // DRUIDA
    "Fuego solar": { clase: "Druida", rama: "Equilibrio", rol: "DPS" },
    "Lluvia de estrellas": { clase: "Druida", rama: "Equilibrio", rol: "DPS" },
    "Triturar": { clase: "Druida", rama: "Feral", rol: "DPS" },
    "Flagelo": { clase: "Druida", rama: "Feral", rol: "DPS/Tanque" },
    "Flor de vida": { clase: "Druida", rama: "Restauración", rol: "Healer" },
    "Rejuvenecimiento": { clase: "Druida", rama: "Restauración", rol: "Healer" }
};

app.post('/upload-log', upload.single('combatlog'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo.' });

    const filePath = req.file.path;
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    let players = {};

    rl.on('line', (line) => {
        if (line.includes('SPELL_DAMAGE') || line.includes('SPELL_HEALING')) {
            const parts = line.split(',');
            if (parts.length > 10) {
                const sourceName = parts[2]?.replace(/"/g, '');
                const spellName = parts[10]?.replace(/"/g, '');
                const amount = parseInt(parts[12]) || 0;

                if (sourceName && !sourceName.includes('Environment') && amount > 0) {
                    if (!players[sourceName]) {
                        players[sourceName] = {
                            nombre: sourceName,
                            clase: "Desconocido",
                            rama: "General",
                            rol: "DPS",
                            totalDaño: 0,
                            totalSana: 0
                        };
                    }

                    if (SPELL_MAPPING[spellName]) {
                        players[sourceName].clase = SPELL_MAPPING[spellName].clase;
                        players[sourceName].rama = SPELL_MAPPING[spellName].rama;
                        players[sourceName].rol = SPELL_MAPPING[spellName].rol;
                    }

                    if (line.includes('SPELL_DAMAGE')) players[sourceName].totalDaño += amount;
                    if (line.includes('SPELL_HEALING')) players[sourceName].totalSana += amount;
                }
            }
        }
    });

    rl.on('close', () => {
        fs.unlink(filePath, () => {});
        const ranking = Object.values(players).sort((a, b) => 
            (b.totalDaño + b.totalSana) - (a.totalDaño + a.totalSana)
        );
        res.json({ success: true, ranking: ranking });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));