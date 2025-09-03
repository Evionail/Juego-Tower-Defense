  // =================================================================================
        // --- ARCHIVO: projectiles.js ---
        // =================================================================================
        class Projectile {
            constructor(game, x, y, target, tower, typeKey, special = null) {
                this.game = game; this.x = x; this.y = y; this.tower = tower; this.typeKey = typeKey;
                this.speed = tower.typeInfo.projectileSpeed; 
                this.damage = tower.typeInfo.damage; 
                this.color = tower.typeInfo.projectileColor; 
                this.active = true;
                this.special = special;
                this.projectileType = tower.typeInfo.projectileType;
                if (this.special === 'sniper') {
                    const evolutionLevel = tower.typeInfo.evolutions.level;
                    const waveBonus = Math.max(0, this.game.waveNumber - evolutionLevel);
                    this.damage *= (1 + waveBonus * 0.15);
                }
                this.targetX = target.x;
                this.targetY = target.y;
                const dx = this.targetX - this.x; const dy = this.targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.velocityX = (dx / dist) * this.speed;
                this.velocityY = (dy / dist) * this.speed;
                this.rotation = Math.atan2(dy, dx);
                this.isGroundTarget = ['cannon', 'ice', 'acid', 'pull', 'teleport'].includes(this.special) || ['cannon', 'ice', 'acid'].includes(this.typeKey);
                if (this.typeKey === 'acid') { this.particles = []; }
            }
            update() {
                if (!this.active) return;
                if (this.projectileType === 'beam' || this.special === 'tesla') { this.active = false; return; }
                this.x += this.velocityX; this.y += this.velocityY;
                if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) { this.active = false; return; }
                if (this.typeKey === 'acid') { this.game.effects.push(new Particle(this.game, this.x, this.y, this.color)); }
                if (this.isGroundTarget) {
                    const distToTarget = Math.hypot(this.x - this.targetX, this.y - this.targetY);
                    if (distToTarget < this.speed) { this.active = false; this.onHitGround(this.targetX, this.targetY); }
                } else {
                    for (const enemy of this.game.enemies) {
                        if (!enemy.active) continue;
                        if (enemy.isFlying && !this.tower.typeInfo.canHitFlying) continue;
                        if (!enemy.isFlying && !this.tower.typeInfo.canHitGround && this.tower.typeInfo.canHitGround !== undefined) continue;
                        const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                        if (dist < enemy.width / 2) { this.active = false; this.onHit(enemy); return; }
                    }
                }
            }
            onHit(enemy) { enemy.takeDamage(this.damage, this.tower); }
            onHitGround(impactX, impactY) {
                const tInfo = this.tower.typeInfo;
                if (tInfo.special === 'pull') { this.game.effects.push(new SingularityEffect(this.game, impactX, impactY, tInfo.splashRadius)); } 
                else if (tInfo.special === 'teleport') {
                    this.game.enemies.forEach(e => {
                        if (!e.active || e.isFlying) return;
                        const d = Math.hypot(e.x - impactX, e.y - impactY);
                        if (d <= tInfo.splashRadius) { e.teleport(3); }
                    });
                }
                if (this.typeKey === 'cannon' && !tInfo.special) {
                    this.game.effects.push(new Effect(this.game, impactX, impactY, tInfo.splashRadius, 'rgba(100, 100, 100, 0.5)', 15));
                    this.game.enemies.forEach(e => {
                        if (!e.active || e.isFlying) return;
                        const dX = e.x - impactX, dY = e.y - impactY; const sDist = Math.sqrt(dX*dX + dY*dY);
                        if (sDist <= tInfo.splashRadius) e.takeDamage(this.damage, this.tower);
                    });
                } else if (this.typeKey === 'ice') { 
                    const slowPower = Math.max(tInfo.slow.maxSlow, tInfo.slow.baseMultiplier - (this.damage * tInfo.slow.damageScale));
                    this.game.effects.push(new Effect(this.game, impactX, impactY, tInfo.slowRadius, 'rgba(3, 169, 244, 0.3)', 20));
                    this.game.enemies.forEach(e => {
                        if (!e.active || e.isFlying) return;
                        const dX = e.x - impactX, dY = e.y - impactY; const sDist = Math.sqrt(dX*dX + dY*dY);
                        if (sDist <= tInfo.slowRadius) { e.applyEffect('slow', { multiplier: slowPower, duration: tInfo.slow.duration }); }
                    });
                } else if (this.typeKey === 'acid') {
                    this.game.effects.push(new AcidPuddle(this.game, impactX, impactY, this.damage, tInfo.acid));
                }
            }
            draw(ctx) {
                if (this.projectileType === 'beam' || this.special === 'tesla') { return; }
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                switch(this.special) {
                    case 'sniper': ctx.fillRect(-10, -1.5, 20, 3); break;
                    case 'gatling': ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); break;
                    case 'pull': ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.game.frameCount * 0.2); ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); break;
                    case 'teleport':
                        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
                        for(let i = 0; i < 3; i++) {
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 1; ctx.beginPath();
                            ctx.moveTo(Math.random() * 10 - 5, Math.random() * 10 - 5);
                            ctx.lineTo(Math.random() * 10 - 5, Math.random() * 10 - 5);
                            ctx.stroke();
                        }
                        break;
                    default:
                        switch(this.typeKey) {
                            case 'ice': ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); break;
                            case 'cannon': ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); break;
                            default: ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
                        }
                }
                ctx.restore();
            }
        }
        // --- FIN DE projectiles.js ---