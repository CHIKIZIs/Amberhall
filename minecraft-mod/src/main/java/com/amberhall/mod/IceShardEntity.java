package com.amberhall.mod;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.projectile.thrown.ThrownItemEntity;
import net.minecraft.item.Item;
import net.minecraft.particle.ItemStackParticleEffect;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.entity.Entity;
import net.minecraft.util.hit.EntityHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.world.World;

/** Ледяной осколок: летит от взорвавшегося ледяного крипера, ранит и замораживает цель. */
public class IceShardEntity extends ThrownItemEntity {
	public IceShardEntity(EntityType<? extends IceShardEntity> type, World world) {
		super(type, world);
	}

	public IceShardEntity(World world, LivingEntity owner) {
		super(ModEntities.ICE_SHARD, owner, world);
	}

	@Override
	protected Item getDefaultItem() {
		return ModItems.ICE_SHARD;
	}

	@Override
	public void tick() {
		super.tick();
		if (!this.getWorld().isClient && this.age > 60) {
			this.discard();
		}
	}

	@Override
	protected void onEntityHit(EntityHitResult hit) {
		super.onEntityHit(hit);
		Entity target = hit.getEntity();
		if (target instanceof FrostCreeperEntity) {
			return;
		}
		DamageSource source = this.getDamageSources().thrown(this, this.getOwner());
		if (target.damage(source, 3.0f) && target instanceof LivingEntity living) {
			living.setFrozenTicks(Math.min(living.getMinFreezeDamageTicks() + 60, living.getFrozenTicks() + 120));
			living.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 80, 1), this);
		}
	}

	@Override
	protected void onCollision(HitResult hit) {
		super.onCollision(hit);
		if (!this.getWorld().isClient) {
			this.getWorld().sendEntityStatus(this, (byte) 3);
			this.getWorld().playSound(null, this.getX(), this.getY(), this.getZ(), SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.HOSTILE, 0.5f, 1.4f);
			this.discard();
		}
	}

	@Override
	public void handleStatus(byte status) {
		if (status == 3) {
			for (int i = 0; i < 6; i++) {
				this.getWorld().addParticle(new ItemStackParticleEffect(ParticleTypes.ITEM, this.getStack()), this.getX(), this.getY(), this.getZ(),
					(this.random.nextDouble() - 0.5) * 0.2, this.random.nextDouble() * 0.15, (this.random.nextDouble() - 0.5) * 0.2);
			}
		}
	}
}
