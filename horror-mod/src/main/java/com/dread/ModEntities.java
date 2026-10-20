package com.dread;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModEntities {
	public static final EntityType<WatcherEntity> WATCHER = Registry.register(Registries.ENTITY_TYPE, DreadMod.id("watcher"),
		EntityType.Builder.create(WatcherEntity::new, SpawnGroup.MONSTER).dimensions(0.6f, 2.4f).maxTrackingRange(16).build("watcher"));

	public static void init() {
		FabricDefaultAttributeRegistry.register(WATCHER, WatcherEntity.createAttributes());
	}
}
