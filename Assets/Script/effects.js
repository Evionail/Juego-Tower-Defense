    // =================================================================================
        // --- ARCHIVO: effects.js ---
        // =================================================================================
        class Effect {
            constructor(game, x, y, radius, color, life, target = null) {
                this.game = game; this.x = x; this.y = y; this.maxRadius = radius; this.color = color;
                this.life = life; this.maxLife = life; this.active = true;
                this.target = target;
            }
            update() { this.life--; if (this.life <= 0) this.active = false; }
            draw(ctx) {
                if (this.target) {
                    ctx.save(); ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.target.x, this.target.y);
                    ctx.strokeStyle = this.color; ctx.lineWidth = 2 + (this.life / this.maxLife) * 3;
                    ctx.globalAlpha = this.life / this.maxLife; ctx.stroke(); ctx.restore();
                } else {
                    ctx.save();
                    const r = this.maxRadius * (1 - (this.life / this.maxLife));
                    ctx.globalAlpha = this.life / this.maxLife; ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                    ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.stroke();
                    ctx.restore();
                }
            }
        }
        
        class PlasmaBeamEffect extends Effect {
            constructor(game, tower, target) {
                super(game, tower.x, tower.y, 0, '', 9999);
                this.tower = tower; this.target = target;
            }
            update() { if (!this.target.active || this.tower.plasmaTarget !== this.target) { this.active = false; } }
            draw(ctx) {
                if (!this.target || !this.target.active) return;
                const stacks = this.tower.plasmaStacks;
                const maxStacks = this.tower.typeInfo.rampUp.maxStacks;
                const intensity = Math.min(1, stacks / (maxStacks * 0.5));
                ctx.save(); ctx.beginPath(); ctx.moveTo(this.tower.x, this.tower.y); ctx.lineTo(this.target.x, this.target.y);
                ctx.strokeStyle = `rgba(255, 50, 100, ${0.2 * intensity})`; ctx.lineWidth = 10 + 8 * intensity;
                ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20; ctx.stroke();
                ctx.strokeStyle = `rgba(255, 150, 150, ${0.7 * intensity})`; ctx.lineWidth = 4 + 3 * intensity;
                ctx.shadowBlur = 10; ctx.stroke();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * intensity})`; ctx.lineWidth = 2;
                ctx.shadowBlur = 5; ctx.stroke();
                ctx.restore();
            }
        }

        class TeslaEffect extends Effect {
            constructor(game, startPos, targetPositions, life) {
                super(game, startPos.x, startPos.y, 0, '#80DEEA', life);
                this.targetPositions = targetPositions;
            }
            draw(ctx) {
                ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(128, 222, 234, ${this.life / this.maxLife})`;
                ctx.shadowColor = '#00BCD4'; ctx.shadowBlur = 10;
                this.targetPositions.forEach(endPos => { this.drawLightning(ctx, this.x, this.y, endPos.x, endPos.y); });
                ctx.restore();
            }
            drawLightning(ctx, x1, y1, x2, y2) {
                ctx.beginPath(); ctx.moveTo(x1, y1);
                const dx = x2 - x1; const dy = y2 - y1; const dist = Math.hypot(dx, dy);
                const segments = Math.max(5, Math.floor(dist / 15)); const roughness = 10;
                for (let i = 1; i < segments; i++) {
                    const t = i / segments;
                    const randX = (Math.random() - 0.5) * roughness * (1 - t);
                    const randY = (Math.random() - 0.5) * roughness * (1 - t);
                    ctx.lineTo(x1 + dx * t + randX, y1 + dy * t + randY);
                }
                ctx.lineTo(x2, y2); ctx.stroke();
            }
        }

        class AcidPuddle extends Effect {
            constructor(game, x, y, damage, acidData) {
                super(game, x, y, TILE_SIZE * 0.8, 'rgba(127, 255, 0, 0.4)', 144);
                this.damage = damage; this.acidData = acidData; this.affectedEnemies = new Set();
            }
            update() {
                super.update();
                this.game.enemies.forEach(e => {
                    if (e.active && !e.isFlying && !this.affectedEnemies.has(e)) {
                        const dist = Math.hypot(this.x - e.x, this.y - e.y);
                        if (dist < this.maxRadius) {
                            const acidDps = this.damage * this.acidData.multiplier;
                            e.applyEffect('acid', { damagePerTick: acidDps, duration: this.acidData.duration });
                            this.affectedEnemies.add(e);
                        }
                    }
                });
            }
            draw(ctx) {
                ctx.save(); ctx.globalAlpha = (this.life / this.maxLife) * 0.5;
                ctx.fillStyle = this.color; ctx.beginPath();
                ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            }
        }

        class Particle extends Effect {
            constructor(game, x, y, color) {
                super(game, x, y, 0, color, 20);
                this.size = Math.random() * 2 + 1;
            }
            draw(ctx) {
                ctx.save(); ctx.globalAlpha = this.life / this.maxLife;
                ctx.fillStyle = this.color; ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            }
        }

        class SingularityEffect extends Effect {
            constructor(game, x, y, radius) {
                super(game, x, y, radius, 'rgba(150, 50, 255, 0.7)', 60);
                this.pullStrength = 2.5;
            }
            update() {
                super.update();
                this.game.enemies.forEach(e => {
                    if (e.active && !e.isFlying) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < this.maxRadius) {
                            const angle = Math.atan2(this.y - e.y, this.x - e.x);
                            e.x += Math.cos(angle) * this.pullStrength;
                            e.y += Math.sin(angle) * this.pullStrength;
                        }
                    }
                });
            }
            draw(ctx) {
                ctx.save();
                const r = this.maxRadius * (this.life / this.maxLife);
                ctx.globalAlpha = (this.life / this.maxLife) * 0.5;
                ctx.fillStyle = this.color; ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            }
        }

        class MeteorEffect extends Effect {
            constructor(game, x, y, radius, damage) {
                super(game, x, y, radius, 'rgba(255, 100, 0, 0.7)', 45);
                this.damage = damage; this.fallDuration = 30; this.hasImpacted = false;
            }
            update() {
                this.life--; if (this.life <= 0) this.active = false;
                if (this.life <= (this.maxLife - this.fallDuration) && !this.hasImpacted) { this.impact(); this.hasImpacted = true; }
            }
            draw(ctx) {
                ctx.save();
                if (this.life > (this.maxLife - this.fallDuration)) {
                    const fallProgress = (this.maxLife - this.life) / this.fallDuration;
                    const meteorY = this.y * fallProgress - 50 * (1-fallProgress);
                    ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.arc(this.x, meteorY, 15, 0, Math.PI * 2); ctx.fill();
                } else {
                    const explosionLife = this.maxLife - this.fallDuration;
                    const r = this.maxRadius * (1 - ((this.life) / explosionLife));
                    ctx.globalAlpha = this.life / explosionLife; ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = this.color; ctx.fill();
                }
                ctx.restore();
            }
            impact() {
                this.game.enemies.forEach(e => {
                    if (!e.active) return;
                    const dX = e.x - this.x, dY = e.y - this.y; const dist = Math.sqrt(dX*dX + dY*dY);
                    if (dist <= this.maxRadius) e.takeDamage(this.damage, null);
                });
            }
        }
        // --- FIN DE effects.js ---