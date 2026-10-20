package com.amberhall.mod;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import java.util.EnumMap;
import java.util.Map;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnLocationTypes;
import net.minecraft.entity.SpawnRestriction;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.world.Heightmap;

public final class ModEntities {
	public static final EntityType<StalkerEntity> STALKER = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("stalker"),
		EntityType.Builder.create(StalkerEntity::new, SpawnGroup.MONSTER)
			.dimensions(0.7f, 2.0f)
			.maxTrackingRange(8)
			.build("stalker"));

	public static final EntityType<FrostCreeperEntity> FROST_CREEPER = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("frost_creeper"),
		EntityType.Builder.create(FrostCreeperEntity::new, SpawnGroup.MONSTER)
			.dimensions(0.6f, 1.7f)
			.maxTrackingRange(8)
			.build("frost_creeper"));

	public static final EntityType<DesertCreeperEntity> DESERT_CREEPER = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("desert_creeper"),
		EntityType.Builder.create(DesertCreeperEntity::new, SpawnGroup.MONSTER)
			.dimensions(0.6f, 1.1f)
			.maxTrackingRange(8)
			.build("desert_creeper"));

	public static final EntityType<IceShardEntity> ICE_SHARD = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("ice_shard"),
		EntityType.Builder.<IceShardEntity>create(IceShardEntity::new, SpawnGroup.MISC)
			.dimensions(0.25f, 0.25f)
			.maxTrackingRange(4)
			.trackingTickInterval(10)
			.build("ice_shard"));

	/** биомные криперы: по одному типу сущности на разновидность */
	public static final Map<VariantType, EntityType<VariantCreeperEntity>> VARIANTS = new EnumMap<>(VariantType.class);
	static {
		for (VariantType v : VariantType.values()) {
			VARIANTS.put(v, Registry.register(Registries.ENTITY_TYPE, AmberhallMod.id(v.entityName()),
				EntityType.Builder.<VariantCreeperEntity>create((type, world) -> new VariantCreeperEntity(type, world, v), SpawnGroup.MONSTER)
					.dimensions(v.width, v.height)
					.maxTrackingRange(8)
					.build(v.entityName())));
		}
	}

	public static void init() {
		for (var e : VARIANTS.entrySet()) {
			FabricDefaultAttributeRegistry.register(e.getValue(), VariantCreeperEntity.createAttributes(e.getKey()));
			SpawnRestriction.register(e.getValue(), SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, HostileEntity::canSpawnInDark);
		}
		FabricDefaultAttributeRegistry.register(STALKER, StalkerEntity.createAttributes());
		FabricDefaultAttributeRegistry.register(FROST_CREEPER, CreeperEntity.createCreeperAttributes());
		FabricDefaultAttributeRegistry.register(DESERT_CREEPER, CreeperEntity.createCreeperAttributes());
		// как зомби и скелеты: в темноте на твёрдой земле
		SpawnRestriction.register(STALKER, SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
			HostileEntity::canSpawnInDark);
		SpawnRestriction.register(DESERT_CREEPER, SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
			HostileEntity::canSpawnInDark);
		SpawnRestriction.register(FROST_CREEPER, SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
			HostileEntity::canSpawnInDark);
	}
}
