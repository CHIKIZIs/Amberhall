package com.amberhall.mod;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnLocationTypes;
import net.minecraft.entity.SpawnRestriction;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.tag.FluidTags;
import net.minecraft.world.Heightmap;

public final class ModEntities {
	public static final EntityType<AmberBeetleEntity> AMBER_BEETLE = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("amber_beetle"),
		EntityType.Builder.create(AmberBeetleEntity::new, SpawnGroup.MONSTER)
			.dimensions(0.9f, 0.6f)
			.maxTrackingRange(8)
			.build("amber_beetle"));

	public static final EntityType<LeviathanEntity> LEVIATHAN = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("leviathan"),
		EntityType.Builder.create(LeviathanEntity::new, SpawnGroup.WATER_CREATURE)
			.dimensions(3.0f, 3.0f)
			.maxTrackingRange(16)
			.build("leviathan"));

	public static final EntityType<GlowMothEntity> GLOW_MOTH = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("glow_moth"),
		EntityType.Builder.create(GlowMothEntity::new, SpawnGroup.AMBIENT)
			.dimensions(0.5f, 0.5f)
			.maxTrackingRange(8)
			.build("glow_moth"));

	public static void init() {
		FabricDefaultAttributeRegistry.register(GLOW_MOTH, GlowMothEntity.createAttributes());
		// порхает у земли: нужен воздух и пространство над поверхностью
		SpawnRestriction.register(GLOW_MOTH, SpawnLocationTypes.UNRESTRICTED, Heightmap.Type.MOTION_BLOCKING,
			(type, world, reason, pos, random) -> world.getBlockState(pos).isAir() && pos.getY() > world.getSeaLevel() - 4);
		FabricDefaultAttributeRegistry.register(LEVIATHAN, LeviathanEntity.createAttributes());
		// живёт только на большой глубине океана (не выше 15 блоков под уровнем моря), в воде
		SpawnRestriction.register(LEVIATHAN, SpawnLocationTypes.IN_WATER, Heightmap.Type.OCEAN_FLOOR,
			(type, world, reason, pos, random) -> pos.getY() < world.getSeaLevel() - 15
				&& world.getFluidState(pos).isIn(FluidTags.WATER));
		FabricDefaultAttributeRegistry.register(AMBER_BEETLE, AmberBeetleEntity.createAttributes());
		// появляется только в тёмных пещерах ниже уровня Y=50, на твёрдой земле
		SpawnRestriction.register(AMBER_BEETLE, SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
			(type, world, reason, pos, random) -> pos.getY() < 50
				&& world.getLightLevel(pos) < 8
				&& world.getBlockState(pos.down()).allowsSpawning(world, pos.down(), type));
	}
}
