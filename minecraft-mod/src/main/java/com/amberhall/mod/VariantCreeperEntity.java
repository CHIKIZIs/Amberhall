package com.amberhall.mod;

import java.util.List;

import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.entity.AreaEffectCloudEntity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

/** Биомный крипер: общий каркас, у каждой разновидности свой взрыв. */
public class VariantCreeperEntity extends CreeperEntity {
	private static final List<Block> FLOWERS = List.of(Blocks.DANDELION, Blocks.POPPY, Blocks.AZURE_BLUET, Blocks.OXEYE_DAISY, Blocks.CORNFLOWER, Blocks.ALLIUM);
	private final VariantType variant;

	public VariantCreeperEntity(EntityType<? extends CreeperEntity> type, World world, VariantType variant) {
		super(type, world);
		this.variant = variant;
	}

	public static DefaultAttributeContainer.Builder createAttributes(VariantType v) {
		return CreeperEntity.createCreeperAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, v.health)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, v.speed);
	}

	public VariantType getVariant() {
		return variant;
	}

	@Override
	protected void explode() {
		if (!(this.getWorld() instanceof ServerWorld world)) {
			return;
		}
		float k = this.shouldRenderOverlay() ? 2.0f : 1.0f;
		double x = this.getX(), y = this.getY(), z = this.getZ();
		switch (variant) {
			case SWAMP -> {
				world.createExplosion(this, x, y, z, 2.5f * k, World.ExplosionSourceType.MOB);
				cloud(world, StatusEffects.POISON, 200, 1);
			}
			case JUNGLE -> world.createExplosion(this, x, y, z, 3.0f * k, World.ExplosionSourceType.MOB);
			case MUSHROOM -> {
				// мирный: блоки не ломает, зато сеет грибы
				world.createExplosion(this, x, y, z, 2.5f * k, World.ExplosionSourceType.NONE);
				plant(world, List.of(Blocks.RED_MUSHROOM, Blocks.BROWN_MUSHROOM), 0.4f);
				world.spawnParticles(ParticleTypes.SPORE_BLOSSOM_AIR, x, y + 1, z, 60, 1.2, 0.8, 1.2, 0.05);
			}
			case BADLANDS -> world.createExplosion(this, x, y, z, 3.5f * k, true, World.ExplosionSourceType.MOB);
			case CAVE -> world.createExplosion(this, x, y, z, 3.0f * k, World.ExplosionSourceType.MOB);
			case MEADOW -> {
				// мирный: блоки не ломает, засеивает цветами и лечит
				world.createExplosion(this, x, y, z, 2.5f * k, World.ExplosionSourceType.NONE);
				plant(world, FLOWERS, 0.5f);
				cloud(world, StatusEffects.REGENERATION, 100, 1);
				world.spawnParticles(ParticleTypes.HAPPY_VILLAGER, x, y + 1, z, 40, 1.2, 0.8, 1.2, 0.05);
			}
			case DARKFOREST -> {
				world.createExplosion(this, x, y, z, 3.0f * k, World.ExplosionSourceType.MOB);
				cloud(world, StatusEffects.BLINDNESS, 160, 0);
			}
		}
		this.discard();
	}

	private void cloud(ServerWorld world, RegistryEntry<StatusEffect> effect, int ticks, int amplifier) {
		AreaEffectCloudEntity cloud = new AreaEffectCloudEntity(world, this.getX(), this.getY(), this.getZ());
		cloud.setRadius(3.0f);
		cloud.setRadiusOnUse(-0.5f);
		cloud.setWaitTime(10);
		cloud.setDuration(ticks);
		cloud.setRadiusGrowth(-cloud.getRadius() / cloud.getDuration());
		cloud.addEffect(new StatusEffectInstance(effect, ticks, amplifier));
		world.spawnEntity(cloud);
	}

	private void plant(ServerWorld world, List<Block> plants, float chance) {
		BlockPos center = this.getBlockPos();
		for (BlockPos pos : BlockPos.iterate(center.add(-3, -2, -3), center.add(3, 2, 3))) {
			if (this.random.nextFloat() < chance && world.getBlockState(pos).isAir()) {
				var state = plants.get(this.random.nextInt(plants.size())).getDefaultState();
				if (state.canPlaceAt(world, pos)) {
					world.setBlockState(pos, state);
				}
			}
		}
	}
}
