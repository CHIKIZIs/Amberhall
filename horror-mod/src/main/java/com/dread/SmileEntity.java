package com.dread;

import java.util.UUID;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.damage.DamageTypes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.PathAwareEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.util.math.MathHelper;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * Улыбающийся: висит в темноте и ухмыляется. Пока на него не смотрят — неподвижен.
 * Стоит встретиться с ним взглядом — он мчится на вас и вцепляется в лицо.
 */
public class SmileEntity extends PathAwareEntity {
	private UUID target;
	private int life;

	public SmileEntity(EntityType<? extends PathAwareEntity> type, World world) {
		super(type, world);
		this.setNoGravity(true);
		this.setPersistent();
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return MobEntity.createMobAttributes().add(EntityAttributes.GENERIC_MAX_HEALTH, 20.0).add(EntityAttributes.GENERIC_FOLLOW_RANGE, 48.0);
	}

	public void setTarget(ServerPlayerEntity p) {
		this.target = p.getUuid();
	}

	@Override
	public boolean isInvulnerableTo(DamageSource source) {
		return !source.isOf(DamageTypes.GENERIC_KILL);
	}

	@Override
	public boolean isPushable() {
		return false;
	}

	@Override
	public void tick() {
		super.tick();
		if (!(this.getWorld() instanceof ServerWorld world)) {
			return;
		}
		this.life++;
		ServerPlayerEntity player = target == null ? null : (world.getPlayerByUuid(target) instanceof ServerPlayerEntity p ? p : null);
		if (player == null || player.isSpectator() || this.life > 1800) {
			vanish(world);
			return;
		}
		Vec3d to = player.getEyePos().subtract(this.getPos().add(0, 0.7, 0));
		double dist = to.length();
		this.setYaw((float) (MathHelper.atan2(to.z, to.x) * 180.0 / Math.PI) - 90.0f);
		this.setHeadYaw(this.getYaw());
		boolean watched = player.getRotationVec(1.0f).dotProduct(to.multiply(-1).normalize()) > 0.9 && player.canSee(this);
		if (watched) {
			// встретились взглядами — рывок в лицо
			this.setVelocity(to.normalize().multiply(0.85));
			this.velocityModified = true;
			if (this.life % 4 == 0) world.spawnParticles(ParticleTypes.SMOKE, this.getX(), this.getY() + 0.7, this.getZ(), 3, 0.1, 0.1, 0.1, 0.01);
			if (dist < 1.6) {
				Jumpscare.trigger(player, 3, true);
				vanish(world);
			}
		} else {
			this.setVelocity(Vec3d.ZERO);
			if (this.life % 160 == 0) player.playSoundToPlayer(DreadSounds.BREATH, SoundCategory.HOSTILE, 0.7f, 0.7f);
		}
	}

	private void vanish(ServerWorld world) {
		world.spawnParticles(ParticleTypes.LARGE_SMOKE, this.getX(), this.getY() + 0.7, this.getZ(), 20, 0.3, 0.3, 0.3, 0.02);
		this.discard();
	}

	@Override
	public void writeCustomDataToNbt(NbtCompound nbt) {
		super.writeCustomDataToNbt(nbt);
		if (target != null) nbt.putUuid("Target", target);
	}

	@Override
	public void readCustomDataFromNbt(NbtCompound nbt) {
		super.readCustomDataFromNbt(nbt);
		if (nbt.containsUuid("Target")) target = nbt.getUuid("Target");
	}
}
