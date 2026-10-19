package com.amberhall.mod;

import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents;
import net.fabricmc.fabric.api.registry.FabricBrewingRecipeRegistryBuilder;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.potion.Potion;
import net.minecraft.potion.Potions;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;

public final class ModEffects {
	public static final RegistryEntry<StatusEffect> RAGE =
		Registry.registerReference(Registries.STATUS_EFFECT, AmberhallMod.id("rage"), new RageEffect());

	/** Зелье бешенства: 45 секунд. Из него обычным порохом варится взрывное, драконьим дыханием — туманное. */
	public static final RegistryEntry<Potion> RAGE_POTION =
		Registry.registerReference(Registries.POTION, AmberhallMod.id("rage"),
			new Potion("rage", new StatusEffectInstance(RAGE, 900)));

	public static void init() {
		// Мирным мобам добавляем цель «бросаться на всех», она включается только под эффектом.
		ServerEntityEvents.ENTITY_LOAD.register((entity, world) -> {
			if (entity instanceof MobEntity mob && RageGoal.needsGoal(mob)) {
				mob.goalSelector.add(1, new RageGoal(mob));
			}
		});

		// Рецепт: Мутное зелье + янтарь.
		FabricBrewingRecipeRegistryBuilder.BUILD.register(builder ->
			builder.registerPotionRecipe(Potions.AWKWARD, ModItems.AMBER_GEM, RAGE_POTION));
	}
}
