package com.amberhall.mod;

import net.minecraft.block.Blocks;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.fluid.Fluids;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * Ледяной крипер: живёт в зимних биомах. Не разрушает блоки: вместо этого при взрыве разлетается
 * веером ледяных осколков, которые ранят и замораживают.
 */
public class FrostCreeperEntity extends CreeperEntity {
	public FrostCreeperEntity(EntityType<? extends CreeperEntity> type, World world) {
		super(type, world);
	}

	@Override
	protected void explode() {
		if (!(this.getWorld() instanceof ServerWorld world)) {
			return;
		}
		// взрывная волна без разрушения блоков: только толчок и небольшой урон
		world.createExplosion(this, this.getX(), this.getY(), this.getZ(), 1.2f, World.ExplosionSourceType.NONE);
		int count = this.shouldRenderOverlay() ? 40 : 24;
		for (int i = 0; i < count; i++) {
			Vec3d dir = new Vec3d(this.random.nextGaussian(), this.random.nextGaussian() * 0.6 + 0.25, this.random.nextGaussian()).normalize();
			double speed = 0.7 + this.random.nextDouble() * 0.7;
			IceShardEntity shard = new IceShardEntity(world, this);
			shard.setPosition(this.getX(), this.getBodyY(0.5), this.getZ());
			shard.setVelocity(dir.x * speed, dir.y * speed, dir.z * speed);
			world.spawnEntity(shard);
		}
		world.spawnParticles(ParticleTypes.SNOWFLAKE, this.getX(), this.getBodyY(0.5), this.getZ(), 60, 0.4, 0.5, 0.4, 0.25);
		world.spawnParticles(ParticleTypes.ITEM_SNOWBALL, this.getX(), this.getBodyY(0.5), this.getZ(), 30, 0.3, 0.4, 0.3, 0.2);
		world.playSound(null, this.getX(), this.getY(), this.getZ(), SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.HOSTILE, 2.0f, 0.7f);
		world.playSound(null, this.getX(), this.getY(), this.getZ(), SoundEvents.BLOCK_AMETHYST_BLOCK_BREAK, SoundCategory.HOSTILE, 2.0f, 0.6f);
		freezeWater(world);
		this.discard();
	}

	/** вода вокруг взрыва схватывается льдом (обычный тающий «морозный лёд»), блоки при этом не ломаются */
	private void freezeWater(ServerWorld world) {
		BlockPos center = this.getBlockPos();
		for (BlockPos pos : BlockPos.iterate(center.add(-3, -2, -3), center.add(3, 1, 3))) {
			if (pos.getSquaredDistance(center) <= 12 && world.getFluidState(pos).isEqualAndStill(Fluids.WATER)
				&& world.getBlockState(pos).isOf(Blocks.WATER) && world.getBlockState(pos.up()).isAir()) {
				world.setBlockState(pos, Blocks.FROSTED_ICE.getDefaultState());
				world.scheduleBlockTick(pos, Blocks.FROSTED_ICE, 60 + this.random.nextInt(40));
			}
		}
	}
}
