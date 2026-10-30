import type { IndustrialModel, PublishEnv, RoiConfig } from './types';
import { isEstimate, isPublishable } from './types';

export interface RoiInput {
    mwhPerYear: number;
    currentFuelId: string;
    bioFuelId: string;
    modelSlug?: string;
}

export interface RoiResult {
    peakKw: number;
    model: IndustrialModel;
    exceedsRange: boolean;
    nowEur: number;
    bioEur: number;
    opexEur: number;
    netSavingEur: number;
    investNetEur: number;
    investIsEstimate: boolean;
    paybackMonths: number | null;
    rentNetEur: number | null;
    rentIsEstimate: boolean;
}

const mid = (r: { min: number; max: number }) => (r.min + r.max) / 2;

export function candidateModels(models: IndustrialModel[], env: PublishEnv): IndustrialModel[] {
    return models
        .filter((m) => m.segment === 'buy')
        .filter((m) => isPublishable(m.price_net_eur, env) && m.aux_power_kw.value !== null)
        .sort((a, b) => a.power_kw.value!.nominal - b.power_kw.value!.nominal);
}

export function computeRoi(
    input: RoiInput,
    cfg: RoiConfig,
    models: IndustrialModel[],
    env: PublishEnv,
): RoiResult {
    const cur =
        cfg.current_fuels.find((f) => f.id === input.currentFuelId) ?? cfg.current_fuels[0];
    const bio = cfg.bio_fuels.find((f) => f.id === input.bioFuelId) ?? cfg.bio_fuels[0];
    const peakKw = ((input.mwhPerYear * 1000) / cfg.full_load_hours) * cfg.sizing_reserve;

    const pool = candidateModels(models, env);
    if (pool.length === 0) throw new Error('ROI: nėra modelių su rodoma kaina');

    let model = input.modelSlug
        ? models.find((m) => m.slug === input.modelSlug && m.price_net_eur.value !== null && m.aux_power_kw.value !== null) ??
          pool.find((m) => m.slug === input.modelSlug)
        : undefined;
    let exceedsRange = false;
    if (!model) {
        model = pool.find((m) => m.power_kw.value!.nominal >= peakKw);
        if (!model) {
            model = pool[pool.length - 1];
            exceedsRange = true;
        }
    }

    const price = model.price_net_eur.value as number;
    const aux = model.aux_power_kw.value as number;
    const nowEur = input.mwhPerYear * mid(cur.eur_per_mwh_heat);
    const bioEur = input.mwhPerYear * mid(bio.eur_per_mwh_heat);
    const opexEur =
        price * cfg.opex.service_pct_of_capex +
        aux * cfg.full_load_hours * cfg.opex.electricity_eur_per_kwh;
    const netSavingEur = nowEur - bioEur - opexEur;
    const paybackMonths = netSavingEur > 0 ? Math.round((price / netSavingEur) * 12) : null;
    const rentOk = isPublishable(model.rent_net_eur_month, env);

    return {
        peakKw: Math.round(peakKw),
        model,
        exceedsRange,
        nowEur: Math.round(nowEur),
        bioEur: Math.round(bioEur),
        opexEur: Math.round(opexEur),
        netSavingEur: Math.round(netSavingEur),
        investNetEur: price,
        investIsEstimate: isEstimate(model.price_net_eur),
        paybackMonths,
        rentNetEur: rentOk ? (model.rent_net_eur_month.value as number) : null,
        rentIsEstimate: isEstimate(model.rent_net_eur_month),
    };
}
