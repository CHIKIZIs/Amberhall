package com.dread;

import java.util.UUID;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.PathAwareEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.MathHelper;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * Наблюдатель: высокая бледная фигура, которая появляется в темноте. Пока на него смотрят — стоит неподвижно.
 * Стоит отвернуться — он оказывается ближе. Если подойти вплотную или смотреть слишком долго — скример.
 */
public class WatcherEntity extends PathAwareEntity {
	private UUID target;
	private int stare;
	private int hopCooldown = 20;
	private int life;

	public WatcherEntity(EntityType<? extends PathAwareEntity> type, World world) {
		super(type, world);
		this.setPersistent();
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return MobEntity.createMobAttributes().add(EntityAttributes.GENERIC_MAX_HEALTH, 40.0).add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.0)
			.add(EntityAttributes.GENERIC_FOLLOW_RANGE, 64.0);
	}

	public void setTarget(ServerPlayerEntity player) {
		this.target = player.getUuid();
	}

	@Override
	public boolean isInvulnerableTo(DamageSource source) {
		return !source.isOf(net.minecraft.entity.damage.DamageTypes.GENERIC_KILL);
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
		if (player == null || player.isSpectator() || player.isDead() || this.life > 2400) {
			vanish(world, null);
			return;
		}
		Vec3d toPlayer = player.getEyePos().subtract(this.getEyePos());
		double dist = toPlayer.length();
		// всегда лицом к игроку
		this.setYaw((float) (MathHelper.atan2(toPlayer.z, toPlayer.x) * 180.0 / Math.PI) - 90.0f);
		this.setHeadYaw(this.getYaw());
		this.bodyYaw = this.getYaw();
		boolean watched = player.getRotationVec(1.0f).dotProduct(toPlayer.multiply(-1).normalize()) > 0.86 && player.canSee(this);
		this.setVelocity(Vec3d.ZERO);
		if (watched) {
			this.stare++;
			if (dist < 8.0 && this.stare > 12) {
				scare(world, player);
				return;
			}
			if (this.stare > 110) {
				// слишком долго смотрели: растворяется, оставив эхо
				player.playSoundToPlayer(DreadSounds.SWELL, SoundCategory.HOSTILE, 1.0f, 0.8f);
				vanish(world, player);
			}
			return;
		}
		this.stare = Math.max(0, this.stare - 2);
		if (--this.hopCooldown <= 0) {
			this.hopCooldown = 6 + this.random.nextInt(10);
			if (dist < 2.4) {
				scare(world, player);
				return;
			}
			Vec3d dir = toPlayer.normalize();
			double step = Math.min(dist - 1.5, 2.0 + this.random.nextDouble() * 2.5);
			BlockPos stand = findStand(world, BlockPos.ofFloored(this.getX() + dir.x * step, this.getY(), this.getZ() + dir.z * step));
			if (stand != null) {
				this.refreshPositionAndAngles(stand.getX() + 0.5, stand.getY(), stand.getZ() + 0.5, this.getYaw(), 0.0f);
			}
		}
	}

	private void scare(ServerWorld world, ServerPlayerEntity player) {
		Jumpscare.trigger(player, 1 + this.random.nextInt(3), true);
		vanish(world, player);
	}

	private void vanish(ServerWorld world, ServerPlayerEntity player) {
		world.spawnParticles(ParticleTypes.LARGE_SMOKE, this.getX(), this.getY() + 1.2, this.getZ(), 30, 0.3, 0.8, 0.3, 0.02);
		this.discard();
	}

	public static BlockPos findStand(ServerWorld world, BlockPos around) {
		for (int dy = 2; dy >= -4; dy--) {
			BlockPos p = around.up(dy);
			if (world.getBlockState(p.down()).isSolidBlock(world, p.down()) && world.getBlockState(p).isAir() && world.getBlockState(p.up()).isAir()
				&& world.getBlockState(p.up(2)).isAir()) {
				return p;
			}
		}
		return null;
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
