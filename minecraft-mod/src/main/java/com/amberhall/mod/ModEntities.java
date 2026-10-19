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

	public static final EntityType<AnglerEntity> DEEP_ANGLER = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("deep_angler"),
		EntityType.Builder.create(AnglerEntity::new, SpawnGroup.WATER_CREATURE)
			.dimensions(1.2f, 1.0f)
			.maxTrackingRange(10)
			.build("deep_angler"));

	public static void init() {
		FabricDefaultAttributeRegistry.register(DEEP_ANGLER, AnglerEntity.createAttributes());
		// живёт только на большой глубине океана (не выше 15 блоков под уровнем моря), в воде
		SpawnRestriction.register(DEEP_ANGLER, SpawnLocationTypes.IN_WATER, Heightmap.Type.OCEAN_FLOOR,
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
