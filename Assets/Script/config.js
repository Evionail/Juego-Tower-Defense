        // =================================================================================
        // --- ARCHIVO: config.js (o al inicio de game.js) ---
        // =================================================================================
        const TILE_SIZE = 40;
        const cheats = {
            unlimitedResources: false,
            unlimitedHealth: false,
            noCooldowns: false,
        };
        const DIFFICULTY_MODIFIERS = {
            easy: { enemyHealth: 0.6, enemySpeed: 0.6, towerCost: 0.5, startingGold: 2.0 },
            normal: { enemyHealth: 1.0, enemySpeed: 1.0, towerCost: 1.0, startingGold: 1.0 },
            hard: { enemyHealth: 1.4, enemySpeed: 1.4, towerCost: 1.5, startingGold: 0.81 }
        };
        const MAPS = {
            'classic': [ { x: 0, y: 5 }, { x: 3, y: 5 }, { x: 3, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 12 }, { x: 13, y: 12 }, { x: 13, y: 7 }, { x: 20, y: 7 } ],
            'serpentine': [ { x: 0, y: 2 }, { x: 17, y: 2 }, { x: 17, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 8 }, { x: 17, y: 8 }, { x: 17, y: 11 }, { x: 0, y: 11 } ],
            'crossroads': [ { x: 0, y: 7 }, { x: 4, y: 7 }, { x: 4, y: 2 }, { x: 15, y: 2 }, { x: 15, y: 7 }, { x: 10, y: 7 }, { x: 10, y: 12 }, { x: 15, y: 12 }, { x: 15, y: 7 }, { x: 20, y: 7 } ],
            'direct': [ { x: 0, y: 7 }, { x: 10, y: 7 }, { x: 10, y: 2 }, { x: 20, y: 2 } ]
        };
        const MAP_THEMES = {
            'classic': { path: '#a58e71', background: '#3a5943' }, // Sendero de tierra, fondo de bosque
            'serpentine': { path: '#e0ac69', background: '#b06533' }, // Arena de cañón, fondo de roca
            'crossroads': { path: '#4a4a4a', background: '#292929' }, // Camino de piedra oscuro, fondo ominoso
            'direct': { path: '#8c92ac', background: '#465069' }  // Asfalto/metal, fondo industrial
        };
        const AIR_PATHS = {
            'classic': [ { x: 0, y: 5 }, { x: 8, y: 5 }, { x: 8, y: 7 }, { x: 20, y: 7 } ],
            'serpentine': [ { x: 0, y: 2 }, { x: 10, y: 6 }, { x: 0, y: 11 } ],
            'crossroads': [ { x: 0, y: 7 }, { x: 10, y: 2 }, { x: 10, y: 12 }, { x: 20, y: 7 } ],
            'direct': [ { x: 0, y: 7 }, { x: 20, y: 2 } ]
        };
        const TOWER_TYPES = {
            'arrow': { 
                name: 'Flechas', emoji: '🏹', desc: 'Rápida y barata. La única defensa inicial contra enemigos aéreos.', cost: 50, damage: 15, range: 100, fireRate: 60, projectileSpeed: 6.7, color: '#8BC34A', projectileColor: '#CDDC39', unlockWave: 1, upgrade: { damage: 8, range: 10, fireRate: 5 }, canHitFlying: true, asset: 'Assets/Towers/Flechas.png',
                evolutions: {
                    level: 8,
                    paths: {
                        pathA: { name: 'Metralleta', emoji: '🎯', desc: 'Dispara ráfagas increíblemente rápidas a corto alcance.', damage: 19, range: 135, fireRate: 5, special: 'gatling', asset: 'Assets/Towers/Metralleta.png' },
                        pathB: { name: 'Francotirador', emoji: '🔭', desc: 'Inflige daño masivo a un enorme alcance, pero muy lentamente. Prioriza enemigos de élite y su daño aumenta con cada oleada.', damage: 1013, range: 280, fireRate: 222, special: 'sniper', projectileSpeed: 15, asset: 'Assets/Towers/Sniper.png' }
                    }
                }
            },
            'cannon': { 
                name: 'Cañón', emoji: '💣', desc: 'Lenta pero poderosa. Su daño en área es ideal contra grupos de enemigos terrestres.', cost: 120, damage: 40, range: 80, fireRate: 120, projectileSpeed: 5.3, color: '#607D8B', projectileColor: '#212121', unlockWave: 3, splashRadius: 65, upgrade: { damage: 25, range: 5, splashRadius: 8, fireRate: 10 }, canHitFlying: false, asset: 'Assets/Towers/Canon.png',
                evolutions: {
                    level: 8,
                    paths: {
                        pathA: { name: 'Bomba Singular', emoji: '🌀', desc: 'No daña, pero atrae a los enemigos cercanos a un solo punto.', damage: 5, fireRate: 180, splashRadius: 120, special: 'pull', projectileColor: '#AB47BC', asset: 'Assets/Towers/Singularidad.png' },
                        pathB: { name: 'Bomba Disforme', emoji: '🌌', desc: 'No daña, pero teletransporta a los enemigos hacia atrás en el camino. Tiene 18 disparos por oleada.', damage: 0, splashRadius: 80, special: 'teleport', shotsPerWave: 18, projectileColor: '#5C6BC0', asset: 'Assets/Towers/Disforme.png' }
                    }
                }
            },
            'laser': {
                name: 'Láser', emoji: '⚡', desc: 'Defensa aérea fundamental. Dispara un haz de energía instantáneo a enemigos voladores.', cost: 80, damage: 100, range: 120, fireRate: 70, projectileSpeed: 50, color: '#F44336', projectileColor: '#FFCDD2', unlockWave: 4, upgrade: { damage: 35, range: 10, fireRate: 6 }, canHitFlying: true, canHitGround: false, projectileType: 'beam', asset: 'Assets/Towers/Laser.png',
                evolutions: {
                    level: 8,
                    paths: {
                        pathA: { name: 'Torre Tesla', emoji: '🌩️', desc: 'Lanza un arco eléctrico que salta entre múltiples enemigos, aéreos y terrestres.', damage: 500, range: 175, fireRate: 78, special: 'tesla', canHitGround: true, chain: { targets: 5 }, evolutionCostMultiplier: 2, asset: 'Assets/Towers/Tesla.png' },
                        pathB: { name: 'Cañón de Plasma', emoji: '🔥', desc: 'Canaliza un rayo de plasma continuo sobre un enemigo aéreo, aumentando su daño con el tiempo. Prioriza a los jefes.', damage: 100, range: 200, fireRate: 10, special: 'plasma', projectileType: 'beam', rampUp: { damage: 200, maxStacks: 50 }, asset: 'Assets/Towers/Pulsar.png' }
                    }
                }
            },
            'acid': { 
                name: 'Ácido', emoji: '🧪', desc: 'Aplica un veneno que daña con el tiempo. El daño del veneno escala con el daño de la torre.', cost: 100, damage: 12, range: 110, fireRate: 108, projectileSpeed: 6.7, color: '#7FFF00', projectileColor: '#ADFF2F', unlockWave: 6, acid: { multiplier: 0.08, duration: 180 }, upgrade: { damage: 6, acidMultiplier: 0.04, range: 10, fireRate: 7 }, canHitFlying: false, asset: 'Assets/Towers/Acido.png',
                evolutions: {
                    level: 8,
                    paths: {
                        pathA: { name: 'Pantano de Alquitrán', emoji: '🛢️', desc: 'Crea charcos más grandes y duraderos que ralentizan y dañan.', asset: 'Assets/Towers/Alquitran.png' },
                        pathB: { name: 'Aspersor de Ácido', emoji: '💦', desc: 'Dispara proyectiles que se dividen al impactar, afectando a más enemigos.', asset: 'Assets/Towers/Aspersor.png' }
                    }
                }
            },
            'ice': { 
                name: 'Hielo', emoji: '❄️', desc: 'Aplica una ralentización en un área que se vuelve más potente con el daño. Mejorar el rango aumenta el área de efecto.', cost: 150, damage: 5, range: 120, fireRate: 90, projectileSpeed: 8, color: '#03A9F4', projectileColor: '#B3E5FC', unlockWave: 9, slow: { baseMultiplier: 0.6, damageScale: 0.002, maxSlow: 0.35, duration: 120 }, slowRadius: 15, upgrade: { damage: 5, range: 10, slowRadius: 10, fireRate: 8 }, canHitFlying: false, asset: 'Assets/Towers/Hielo.png',
                evolutions: {
                    level: 8,
                    paths: {
                        pathA: { name: 'Generador de Ventisca', emoji: '🌪️', desc: 'Crea una ventisca continua que daña y ralentiza a todos los enemigos en un área enorme.', asset: 'Assets/Towers/Tormenta.png' },
                        pathB: { name: 'Fragmentación Glacial', emoji: '🧊', desc: 'Los enemigos derrotados mientras están congelados explotan, congelando a otros enemigos cercanos.', asset: 'Assets/Towers/Fragmentos.png' }
                    }
                }
            }
        };
        const ENEMY_TYPES = {
            'standard': { name: 'Esbirro', desc: 'Unidad básica terrestre. Débil pero numerosa.', health: 1, speed: 1, value: 1, color: '#E53935', size: 0.8, baseDamage: 10, isFlying: false },
            'fast': { name: 'Corredor', desc: 'Rápido y pequeño. Difícil de acertar para torres lentas.', health: 0.7, speed: 1.8, value: 1.2, color: '#FDD835', size: 0.6, baseDamage: 10, isFlying: false },
            'flying': { name: 'Espectro', desc: 'Ignora el camino y vuela directo a la base. Solo algunas torres pueden atacarlo.', health: 0.8, speed: 1.2, value: 1.5, color: '#E0E0E0', size: 0.7, baseDamage: 15, isFlying: true },
            'healer': { name: 'Sanador', desc: 'Cura a los aliados cercanos. Se vuelve invulnerable por 3 segundos cada 5 segundos. ¡Una prioridad alta!', health: 1.2, speed: 0.8, value: 3, color: '#FF80AB', size: 0.9, baseDamage: 5, isFlying: false, healAmount: 0.1, healRadius: 80, healRate: 240 },
            'disabler': { name: 'Disruptor', desc: 'Desactiva temporalmente las torres cercanas y avanza rápidamente cada 8 segundos.', health: 1.5, speed: 0.9, value: 4, color: '#D500F9', size: 0.9, baseDamage: 5, isFlying: false, disableRadius: 100, disableDuration: 180, disableRate: 300 },
            'boss': { name: 'Jefe', desc: 'Extremadamente resistente y peligroso. ¡Prepárate bien!', health: 15, speed: 0.6, value: 20, color: '#6A1B9A', size: 1.5, baseDamage: 0.55, isFlying: false }
        };
        const ABILITIES = {
            meteor: { cost: 4, cooldown: (60 * 30) * 3, damage: (300 * 3.5) * 2, radius: 160 },
            goldRush: { cost: 2, cooldown: 60 * 45, duration: 60 * 8, multiplier: 2.8 }
        };
        const MASTERY_BONUSES = {
            'classic': {
                description: "Torres de Flechas infligen un 15% más de daño.",
                apply: (game) => {
                    game.towerTypes.arrow.damage *= 1.15;
                }
            },
            'serpentine': {
                description: "Empiezas con 100 de oro adicional.",
                apply: (game) => {
                    game.gold += 100;
                }
            },
            'crossroads': {
                description: "La base tiene 25 de vida máxima adicional.",
                apply: (game) => {
                    game.maxBaseHealth += 25;
                    game.baseHealth += 25;
                }
            },
            'direct': {
                description: "Los Cañones tienen un 10% más de radio de explosión.",
                apply: (game) => {
                    game.towerTypes.cannon.splashRadius *= 1.10;
                }
            }
        };
        // --- FIN DE config.js ---