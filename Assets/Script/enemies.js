// =================================================================================
        // --- ARCHIVO: enemies.js ---
        // =================================================================================
        class Enemy {
            constructor(game, x, y, baseHealth, baseValue, config) {
                this.game = game; this.x = x; this.y = y;
                this.type = config.type;
                const typeData = ENEMY_TYPES[this.type];
                const baseModifiers = DIFFICULTY_MODIFIERS[game.difficulty];

                let finalHealthMod = baseModifiers.enemyHealth;
                let finalSpeedMod = baseModifiers.enemySpeed;

                // Lógica de dificultad progresiva
                if (game.difficulty === 'hard') {
                    if (game.waveNumber === 1) { finalHealthMod = 1.1; finalSpeedMod = 1.1; }
                    else if (game.waveNumber === 2) { finalHealthMod = 1.2; finalSpeedMod = 1.2; }
                    else if (game.waveNumber === 3) { finalHealthMod = 1.3; finalSpeedMod = 1.3; }
                }

                let waveSpeedMultiplier = 1 + game.waveNumber * 0.05;
                let waveHealthMultiplier = 1 + (game.waveNumber * 0.075);

                if (game.waveNumber <= 5 && game.difficulty !== 'hard') {
                    waveHealthMultiplier *= 0.7;
                    waveSpeedMultiplier *= 0.85;
                }

                this.isFlying = config.isFlying || typeData.isFlying;
                this.speed = typeData.speed * waveSpeedMultiplier * finalSpeedMod;
                this.maxHealth = Math.floor(baseHealth * typeData.health * waveHealthMultiplier * finalHealthMod);
                
                if (['boss', 'healer', 'disabler'].includes(this.type)) { this.maxHealth *= 2; }

                this.health = this.maxHealth;
                this.value = Math.floor(baseValue * typeData.value);
                let damageToDeal = typeData.baseDamage;

                if (config.isTutorial) { this.health *= 0.5; this.maxHealth *= 0.5; this.value *= 3; damageToDeal = 20; }

                this.baseDamage = damageToDeal;
                this.width = TILE_SIZE * typeData.size; this.height = TILE_SIZE * typeData.size;
                this.color = typeData.color;
                this.pathIndex = 0; this.active = true; this.damagingTowers = new Set();
                this.effects = new Map();
                if (this.type === 'healer') {
                    this.abilityCooldown = 0; this.isInvulnerable = true;
                    this.invulnerabilityTimer = 180; this.invulnerabilityCooldown = 300;
                    const healAmountBase = typeData.healAmount;
                    this.healAmount = game.difficulty === 'hard' ? healAmountBase * 1.65 : healAmountBase * 1.45;
                }
                if (this.type === 'disabler') { this.dashCooldown = 480; }
            }
            update(allEnemies, allTowers) {
                if (!this.active) return;
                if (this.type === 'healer') {
                    if (this.invulnerabilityTimer > 0) {
                        this.invulnerabilityTimer--;
                        if (this.invulnerabilityTimer <= 0) { this.isInvulnerable = false; this.abilityCooldown = this.invulnerabilityCooldown; }
                    } else if (this.abilityCooldown > 0) {
                        this.abilityCooldown--;
                        if (this.abilityCooldown <= 0) { this.isInvulnerable = true; this.invulnerabilityTimer = 180; }
                    }
                }
                if (this.type === 'disabler') {
                    this.dashCooldown--;
                    if (this.dashCooldown <= 0) {
                        this.pathIndex = Math.min(this.pathIndex + 2, this.game.path.length - 1);
                        const newPos = this.game.path[this.pathIndex];
                        if(newPos) { this.x = newPos.x; this.y = newPos.y + TILE_SIZE / 2; }
                        this.dashCooldown = 480;
                    }
                }
                let currentSpeedMultiplier = 1;
                const effectsToRemove = [];
                for (const [type, effect] of this.effects.entries()) {
                    effect.duration--;
                    if (type === 'acid') { this.takeDamage(effect.damagePerTick, null); }
                    if (type === 'slow') { currentSpeedMultiplier = Math.min(currentSpeedMultiplier, effect.multiplier); }
                    if (effect.duration <= 0) { effectsToRemove.push(type); }
                }
                effectsToRemove.forEach(type => this.effects.delete(type));
                if (this.type === 'healer') {
                    this.abilityCooldown--;
                    if (this.abilityCooldown <= 0) {
                        const typeData = ENEMY_TYPES.healer;
                        this.game.effects.push(new Effect(this.game, this.x, this.y, typeData.healRadius, 'rgba(255, 128, 171, 0.3)', 15));
                        allEnemies.forEach(e => {
                            if (e !== this && e.active) {
                                const dist = Math.hypot(this.x - e.x, this.y - e.y);
                                if (dist < typeData.healRadius) { e.health = Math.min(e.maxHealth, e.health + (e.maxHealth * this.healAmount)); }
                            }
                        });
                        this.abilityCooldown = typeData.healRate;
                    }
                }
                if (this.type === 'disabler') {
                    this.abilityCooldown--;
                    if (this.abilityCooldown <= 0) {
                        const typeData = ENEMY_TYPES.disabler;
                        this.game.effects.push(new Effect(this.game, this.x, this.y, typeData.disableRadius, 'rgba(213, 0, 249, 0.3)', 15));
                        allTowers.forEach(t => {
                            const dist = Math.hypot(this.x - t.x, this.y - t.y);
                            if (dist < typeData.disableRadius) { t.disabledTimer = typeData.disableDuration; }
                        });
                        this.abilityCooldown = typeData.disableRate;
                    }
                }
                const currentPath = this.isFlying ? this.game.airPath : this.game.path;
                const targetPoint = currentPath[this.pathIndex]; 
                if (!targetPoint) return;
                const dx = targetPoint.x - this.x, dy = targetPoint.y + TILE_SIZE / 2 - this.y; const dist = Math.sqrt(dx * dx + dy * dy);
                const currentSpeed = this.speed * currentSpeedMultiplier;
                if (dist < currentSpeed) {
                    this.pathIndex++;
                    if (this.pathIndex >= currentPath.length) {
                        this.active = false;
                        let finalDamage = this.baseDamage;
                        if (finalDamage < 1) finalDamage = Math.floor(this.game.maxBaseHealth * finalDamage);
                        this.game.damageBase(finalDamage); return;
                    }
                } else { this.x += (dx / dist) * currentSpeed; this.y += (dy / dist) * currentSpeed; }
            }
            draw(ctx, frameCount) {
                ctx.save();
                if (this.isFlying) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y + this.height / 2 + 5, this.width / 2, this.width / 4, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = this.color; 
                if (this.isInvulnerable) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frameCount * 0.3); }
                ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                ctx.globalAlpha = 1;
                if (this.effects.size > 0) {
                    const firstEffectType = this.effects.keys().next().value;
                    let flashColor = '';
                    if (firstEffectType === 'acid') flashColor = 'rgba(127, 255, 0, 0.7)';
                    if (firstEffectType === 'slow') flashColor = 'rgba(100, 181, 246, 0.7)';
                    if (flashColor && frameCount % 20 < 10) { ctx.fillStyle = flashColor; ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height); }
                }
                if (this.type === 'healer') {
                    ctx.strokeStyle = '#f44336'; ctx.lineWidth = 3; const crossSize = this.width / 4;
                    ctx.beginPath(); ctx.moveTo(this.x, this.y - crossSize); ctx.lineTo(this.x, this.y + crossSize); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(this.x - crossSize, this.y); ctx.lineTo(this.x + crossSize, this.y); ctx.stroke();
                }
                if (this.type === 'disabler' && frameCount % 4 < 2) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 1;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(this.x - this.width/2 + Math.random() * this.width, this.y - this.height/2 + Math.random() * this.height);
                        ctx.lineTo(this.x - this.width/2 + Math.random() * this.width, this.y - this.height/2 + Math.random() * this.height);
                        ctx.stroke();
                    }
                }
                const hbW = this.width, hbH = 5; ctx.fillStyle = '#333'; ctx.fillRect(this.x - hbW / 2, this.y - this.height / 2 - 10, hbW, hbH);
                ctx.fillStyle = '#76FF03'; ctx.fillRect(this.x - hbW / 2, this.y - this.height / 2 - 10, hbW * (this.health / this.maxHealth), hbH);
                ctx.restore();
            }
            takeDamage(amount, tower) {
                if (this.isInvulnerable) return;
                this.health -= amount; if (tower) this.damagingTowers.add(tower);
                if (this.health <= 0 && this.active) {
                    this.active = false; 
                    this.game.enemyDefeated(this);
                }
            }
            applyEffect(type, effectData) { this.effects.set(type, { ...effectData }); }
             teleport(indicesBack) {
                this.pathIndex = Math.max(0, this.pathIndex - indicesBack);
                const newPos = this.game.path[this.pathIndex];
                if (newPos) { this.x = newPos.x; this.y = newPos.y; }
            }
        }
        // --- FIN DE enemies.js ---