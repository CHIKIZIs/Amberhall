package com.dread;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.RevengeGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.world.World;

/** Ползун: быстрый хищник тёмных мест. Бросается на игрока на четвереньках; первое попадание сопровождается скримером. */
public class CrawlerEntity extends HostileEntity {
	private long lastScare = -10000;

	public CrawlerEntity(EntityType<? extends HostileEntity> type, World world) {
		super(type, world);
		this.experiencePoints = 10;
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return HostileEntity.createHostileAttributes().add(EntityAttributes.GENERIC_MAX_HEALTH, 30.0).add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.40)
			.add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 5.0).add(EntityAttributes.GENERIC_FOLLOW_RANGE, 40.0);
	}

	@Override
	protected void initGoals() {
		this.goalSelector.add(1, new MeleeAttackGoal(this, 1.35, true));
		this.goalSelector.add(5, new WanderAroundFarGoal(this, 0.9));
		this.goalSelector.add(6, new LookAroundGoal(this));
		this.targetSelector.add(1, new RevengeGoal(this));
		this.targetSelector.add(2, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
	}

	@Override
	public boolean tryAttack(net.minecraft.entity.Entity target) {
		boolean hit = super.tryAttack(target);
		if (hit && target instanceof ServerPlayerEntity player && this.getWorld().getTime() - lastScare > 600) {
			lastScare = this.getWorld().getTime();
			Jumpscare.trigger(player, 2, false);
		}
		return hit;
	}

	@Override
	public void tickMovement() {
		super.tickMovement();
		// днём под открытым небом рассыпается: боится света
		if (!this.getWorld().isClient && this.getWorld().isDay() && this.getWorld().isSkyVisible(this.getBlockPos()) && this.age > 100) {
			this.discard();
		}
	}

	@Override
	protected SoundEvent getAmbientSound() {
		return DreadSounds.GROWL;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return DreadSounds.GROWL;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return DreadSounds.SCREAM;
	}

	@Override
	public int getMinAmbientSoundDelay() {
		return 80;
	}
}
