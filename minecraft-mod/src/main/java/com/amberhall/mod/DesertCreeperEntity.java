package com.amberhall.mod;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.world.World;

/** Пустынный крипер: маленький и милый, но взрыв у него мощнее обычного — рушит примерно вдвое больше блоков. */
public class DesertCreeperEntity extends CreeperEntity {
	/** радиус взрыва: у обычного крипера 3, объём разрушения растёт кубом радиуса: 4 даёт примерно 2,4× блоков */
	private static final float POWER = 4.0f;

	public DesertCreeperEntity(EntityType<? extends CreeperEntity> type, World world) {
		super(type, world);
	}

	@Override
	protected void explode() {
		if (this.getWorld() instanceof ServerWorld world) {
			float multiplier = this.shouldRenderOverlay() ? 2.0f : 1.0f;
			world.createExplosion(this, this.getX(), this.getY(), this.getZ(), POWER * multiplier, World.ExplosionSourceType.MOB);
			this.discard();
		}
	}
}
