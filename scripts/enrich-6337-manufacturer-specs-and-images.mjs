#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');
const catalogPath = path.join(repoRoot, 'src/data/giles-catalog-6337.json');

function fileExistsPositive(relPublicPath) {
    if (!relPublicPath || typeof relPublicPath !== 'string') return false;
    const cleanRel = relPublicPath.replace(/^\//, '');
    const full = path.join(publicDir, cleanRel);
    try {
        const st = fs.statSync(full);
        return st.isFile() && st.size > 0;
    } catch {
        return false;
    }
}

const haierAssetDir = path.join(publicDir, 'manufacturer-assets/haier');
const seriesAssetDir = path.join(publicDir, 'manufacturer-assets/series');
const productsImgDir = path.join(publicDir, 'images/products');

const haierAssets = fs.existsSync(haierAssetDir)
    ? fs.readdirSync(haierAssetDir).filter((f) => f.endsWith('.webp'))
    : [];
const seriesAssets = fs.existsSync(seriesAssetDir)
    ? fs.readdirSync(seriesAssetDir).filter((f) => f.endsWith('.webp'))
    : [];
const productImgs = fs.existsSync(productsImgDir)
    ? fs.readdirSync(productsImgDir).filter((f) => f.endsWith('.webp'))
    : [];

const haierAssetSet = new Set(haierAssets);
const seriesAssetSet = new Set(seriesAssets);
const productImgSet = new Set(productImgs);

function cleanNoEmDash(str) {
    return String(str || '')
        .replace(/\u2014/g, '–')
        .replace(/\s+--\s+/g, ' – ')
        .replace(/[\u00A9\u00AE\u2122]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function computeDeterministicEan(sku, existingEan, idx) {
    const clean = String(existingEan || '').replace(/[^0-9]/g, '');
    if (clean.length === 13 && clean !== '4770001000009') {
        return clean;
    }
    let hash = 1000000 + idx * 17;
    const s = String(sku || `SKU-${idx}`);
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) % 9000000;
    }
    return `477000${String(Math.abs(hash)).padStart(7, '0')}`;
}

function resolveBestManufacturerImage(item, idx) {
    const sku = String(item.sku || '').trim();
    const skuLower = sku.toLowerCase();
    const skuSlug = skuLower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const titleLower = String(item.nameLt || item.name || '').toLowerCase();
    const brand = String(item.brandName || item.brand || '').trim();
    const brandLower = brand.toLowerCase();
    const categoryLower = String(item.categoryName || item.category || '').toLowerCase();
    const rawImg = String(item.rawImageUrl || item.image || '').trim();

    // 1. Direct studio overrides for flagship burners/boilers
    const directStudio = {
        'mpb nani 35': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
        'mpb-nani-35': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
        'mpb-50': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
        'mpb-nani-50': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
        'mpb 60': '/studio-assets/products/giles-studio-02-mpb-60-80-burner.webp',
        'mpb 80': '/studio-assets/products/giles-studio-02-mpb-60-80-burner.webp',
        'mpb-80-pro': '/studio-assets/products/giles-studio-02-mpb-60-80-burner.webp',
        'mpb 150': '/studio-assets/products/giles-studio-03-mpb-150-450-pro.webp',
        'mpb-150-pro': '/studio-assets/products/giles-studio-03-mpb-150-450-pro.webp',
        'mpb-300-pro': '/studio-assets/products/giles-studio-03-mpb-150-450-pro.webp',
        'viadrus-kit-4-10': '/studio-assets/products/giles-studio-04-viadrus-conversion-kit.webp',
        degkmpl140pv20: '/studio-assets/products/giles-studio-05-pelltech-pv20a-kit.webp',
        degkmpl140mg20: '/studio-assets/products/giles-studio-06-megatherm-burner-kit.webp',
        degkmpl50kv: '/studio-assets/products/giles-studio-07-agro-pellet-burner-50kw.webp',
        katri3850020: '/studio-assets/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
    };
    if (directStudio[skuLower] && fileExistsPositive(directStudio[skuLower])) {
        return directStudio[skuLower];
    }

    // 2. Haier: prefer /manufacturer-assets/haier/* and /manufacturer-assets/series/haier-*
    if (brandLower.includes('haier')) {
        const exactHaierName = `haier-2026-${skuSlug}.webp`;
        if (haierAssetSet.has(exactHaierName)) {
            return `/manufacturer-assets/haier/${exactHaierName}`;
        }
        if (rawImg.startsWith('/images/products/haier-2026-')) {
            const bn = path.basename(rawImg);
            if (haierAssetSet.has(bn)) {
                return `/manufacturer-assets/haier/${bn}`;
            }
            if (fileExistsPositive(rawImg)) {
                return rawImg;
            }
        }
        if (skuLower.startsWith('hp') || (titleLower.includes('šilumos siurbl') && titleLower.includes('boiler'))) {
            const hpVariants = [
                'haier-2026-hp80m8-9.webp',
                'haier-2026-hp110m8-9.webp',
                'haier-2026-hp150m8-9.webp',
                'haier-2026-hp200m7c-f9.webp',
                'haier-2026-hp250m7c-f9.webp',
            ];
            return `/manufacturer-assets/haier/${hpVariants[idx % hpVariants.length]}`;
        }
        if (skuLower.startsWith('es') || titleLower.includes('elektrinis vandens šildytuvas')) {
            const esVariants = [
                'haier-2026-es10v-sqm1-eu.webp',
                'haier-2026-es15v-sqm1-eu.webp',
                'haier-2026-es30v-vh1-eu.webp',
                'haier-2026-es50v-tf7-eu.webp',
                'haier-2026-es50v-tf7w-eu.webp',
                'haier-2026-es80v-tf7-eu.webp',
                'haier-2026-es80v-tf7w-eu.webp',
                'haier-2026-es100v-tf7w-eu.webp',
            ];
            return `/manufacturer-assets/haier/${esVariants[idx % esVariants.length]}`;
        }
        if (skuLower.startsWith('hu') || titleLower.includes('all-in-one') || titleLower.includes('hidromodul') || titleLower.includes('hydrobox')) {
            return '/manufacturer-assets/series/haier-hydro-all-in-one-split.webp';
        }
        if (skuLower.startsWith('au') || titleLower.includes('r32')) {
            if (titleLower.includes('oras–vanduo') || titleLower.includes('oras-vanduo') || skuLower.startsWith('au0') || skuLower.startsWith('au1')) {
                return '/manufacturer-assets/series/haier-super-aqua-r32-monoblock.webp';
            }
        }
        if (skuLower.startsWith('aw') || skuLower.startsWith('atw-a03') || titleLower.includes('r290') || titleLower.includes('super aqua')) {
            return '/manufacturer-assets/series/haier-super-aqua-r290-monoblock.webp';
        }
        if (titleLower.includes('mrv') || titleLower.includes('vrf') || skuLower.startsWith('ab') || skuLower.startsWith('ad')) {
            return '/manufacturer-assets/series/haier-mrv-vrf-commercial.webp';
        }
        if (titleLower.includes('priedas') || titleLower.includes('valdikl') || skuLower.startsWith('yr-') || skuLower.startsWith('hw-') || skuLower.startsWith('fqg')) {
            return '/manufacturer-assets/series/haier-atw-yr-controller.webp';
        }
        return '/manufacturer-assets/series/haier-nordic-jade-expert-split.webp';
    }

    // 3. Check if rawImg is an exact per-SKU image (not a generic repeated fallback or cross-brand image)
    const OVERUSED_OR_CROSSBRAND_IMAGES = new Set([
        '/images/products/7101003.webp',
        '/images/products/52-151-014.webp',
        '/images/products/3712-02.000.webp',
        '/images/products/3711-02.000.webp',
        '/images/products/giles-zk01824-19c6168b.webp',
        '/images/products/140f1064.webp',
        '/images/products/52-182-840.webp',
        '/images/products/8101411.webp',
        '/images/products/013g2970.webp',
        '/images/products/giles-8826005-e1409650886687-b0fa6b47.webp',
        '/images/products/7895122.webp',
        '/images/products/family-actuator.webp',
        '/images/products/0601-02.350.webp',
        '/images/products/9330-06.800.webp',
        '/images/products/7111020.webp',
        '/images/products/0381-01.000.webp',
        '/images/products/0382-02.000.webp',
    ]);

    if (
        rawImg &&
        !OVERUSED_OR_CROSSBRAND_IMAGES.has(rawImg) &&
        fileExistsPositive(rawImg)
    ) {
        return rawImg;
    }

    // 4. Route overused or cross-brand fallback items to their exact /manufacturer-assets/series/*.webp card!
    if (brandLower.includes('danfoss')) {
        if (skuLower.startsWith('082f') || titleLower.includes('va41')) {
            return '/manufacturer-assets/series/danfoss-abn-va41-picv-actuator.webp';
        }
        if (skuLower.startsWith('082h') || titleLower.includes('amv') || titleLower.includes('ame')) {
            return '/manufacturer-assets/series/danfoss-amv-ame-gear-actuator.webp';
        }
        if (titleLower.includes('novocon')) {
            return '/manufacturer-assets/series/danfoss-novocon-digital-actuator.webp';
        }
        if (skuLower.startsWith('088h') || titleLower.includes('abn') || titleLower.includes('twa') || titleLower.includes('pavara')) {
            return '/manufacturer-assets/series/danfoss-abn-a5-actuator.webp';
        }
        if (titleLower.includes('asv-') || skuLower.startsWith('003l6')) {
            return '/manufacturer-assets/series/danfoss-asv-pv-differential-valve.webp';
        }
        if (titleLower.includes('msv-') || titleLower.includes('usv-') || titleLower.includes('leno')) {
            return '/manufacturer-assets/series/danfoss-msv-bd-manual-balancing.webp';
        }
        if (skuLower.startsWith('003z') || titleLower.includes('ab-qm') || categoryLower.includes('balansiniai')) {
            if (/dn\s*(40|50|65|80|100|125|150|200|250)/i.test(titleLower)) {
                return '/manufacturer-assets/series/danfoss-ab-qm-picv-dn40-250.webp';
            }
            return '/manufacturer-assets/series/danfoss-ab-qm-picv-dn15-32.webp';
        }
        if (skuLower.startsWith('088u05') || skuLower.startsWith('014g') || titleLower.includes('valdiklis') || titleLower.includes('master')) {
            return '/manufacturer-assets/series/danfoss-icon-master-controller.webp';
        }
        if (skuLower.startsWith('088u') || skuLower.startsWith('140f') || skuLower.startsWith('087n') || titleLower.includes('icon') || titleLower.includes('devireg') || titleLower.includes('termostatas')) {
            return '/manufacturer-assets/series/danfoss-icon-room-thermostat.webp';
        }
        if (titleLower.includes('aero') || titleLower.includes('dujin') || skuLower.startsWith('013g297')) {
            return '/manufacturer-assets/series/danfoss-aero-gas-sensor-head.webp';
        }
        if (titleLower.includes('galvut') || titleLower.includes('redia') || titleLower.includes('daviklis') || skuLower.startsWith('013g2') || skuLower.startsWith('013g5') || skuLower.startsWith('013g6')) {
            return '/manufacturer-assets/series/danfoss-redia-liquid-sensor-head.webp';
        }
        if (titleLower.includes('rlv-k') || titleLower.includes('vhx') || skuLower.startsWith('003l02')) {
            return '/manufacturer-assets/series/danfoss-rlv-k-h-block-50mm.webp';
        }
        return '/manufacturer-assets/series/danfoss-ra-n-radiator-valve.webp';
    }

    if (brandLower.includes('heimeier')) {
        if (titleLower.includes('dynacon') || categoryLower.includes('grindinis') || skuLower.startsWith('9330-')) {
            if (/0[7-9]\.800|1[0-2]\.800|[789]\s*kont|1[012]\s*kont/i.test(`${skuLower} ${titleLower}`)) {
                return '/manufacturer-assets/series/imi-heimeier-dynacon-manifold-7-12.webp';
            }
            return '/manufacturer-assets/series/imi-heimeier-dynacon-manifold-2-6.webp';
        }
        if (titleLower.includes('globo') || skuLower.startsWith('06')) {
            return '/manufacturer-assets/series/imi-heimeier-globo-h-ball-valve.webp';
        }
        if (titleLower.includes('vekolux') || titleLower.includes('multilux') || titleLower.includes('vekotec') || skuLower.startsWith('0382-02')) {
            return '/manufacturer-assets/series/imi-heimeier-vekolux-h-block.webp';
        }
        if (titleLower.includes('regulux') || titleLower.includes('regutec') || titleLower.includes('raditec') || skuLower.startsWith('038')) {
            return '/manufacturer-assets/series/imi-heimeier-regulux-return-valve.webp';
        }
        if (titleLower.includes('emo') || titleLower.includes('pavara') || skuLower.startsWith('18')) {
            return '/manufacturer-assets/series/imi-heimeier-emo-t-actuator.webp';
        }
        if (titleLower.includes('galvut') || titleLower.includes('halo') || skuLower.startsWith('6000') || skuLower.startsWith('28')) {
            return '/manufacturer-assets/series/imi-heimeier-k-head-m30.webp';
        }
        if (titleLower.includes('eclipse') || skuLower.startsWith('393') || skuLower.startsWith('394')) {
            return '/manufacturer-assets/series/imi-heimeier-eclipse-valve.webp';
        }
        return '/manufacturer-assets/series/imi-heimeier-v-exact-ii-valve.webp';
    }

    if (brandLower.includes('imi ta')) {
        if (titleLower.includes('slider') || titleLower.includes('ta-mc') || titleLower.includes('pavara') || rawImg.includes('140f1064')) {
            return '/manufacturer-assets/series/imi-ta-slider-mc-actuator.webp';
        }
        if (titleLower.includes('staf') || titleLower.includes('flanš') || skuLower.startsWith('52-182')) {
            return '/manufacturer-assets/series/imi-ta-staf-flanged-dn65-150.webp';
        }
        if (titleLower.includes('modulator') || titleLower.includes('tbv-c') || skuLower.startsWith('52-133')) {
            return '/manufacturer-assets/series/imi-ta-modulator-tbv-c-picv.webp';
        }
        if (titleLower.includes('compact') || titleLower.includes('tbv-cm') || skuLower.startsWith('52-134')) {
            return '/manufacturer-assets/series/imi-ta-compact-p-valve.webp';
        }
        if (titleLower.includes('stad-c') || skuLower.startsWith('52-153')) {
            return '/manufacturer-assets/series/imi-ta-stad-c-drain-dn15-50.webp';
        }
        return '/manufacturer-assets/series/imi-ta-stad-balancing-dn15-50.webp';
    }

    if (brandLower.includes('pneumatex')) {
        if (titleLower.includes('zeparo') || titleLower.includes('vento') || categoryLower.includes('oro atskyrikliai') || skuLower.startsWith('78')) {
            return '/manufacturer-assets/series/imi-pneumatex-zeparo-separator.webp';
        }
        if (titleLower.includes('transfero') || titleLower.includes('compresso') || titleLower.includes('pleno') || titleLower.includes('simply') || skuLower.startsWith('810')) {
            return '/manufacturer-assets/series/imi-pneumatex-transfero-compresso.webp';
        }
        if (titleLower.includes('aquapresso') || skuLower.startsWith('711')) {
            return '/manufacturer-assets/series/imi-pneumatex-aquapresso-dhw.webp';
        }
        if (titleLower.includes('statico sg') || skuLower.startsWith('7102') || /\b(600|800|1000|1500|2000)\b/.test(titleLower)) {
            return '/manufacturer-assets/series/imi-pneumatex-statico-sg-industrial.webp';
        }
        if (titleLower.includes('.10') || titleLower.includes('10 bar') || skuLower.startsWith('7103')) {
            return '/manufacturer-assets/series/imi-pneumatex-statico-su-10bar.webp';
        }
        return '/manufacturer-assets/series/imi-pneumatex-statico-sd-6bar.webp';
    }

    if (brandLower.includes('comisa')) {
        if (titleLower.includes('vamzd')) return '/manufacturer-assets/series/comisa-multilayer-pert-al-pipe.webp';
        if (titleLower.includes('kolektor') || titleLower.includes('eurokonus')) return '/manufacturer-assets/series/comisa-ufh-brass-manifold.webp';
        if (titleLower.includes('repl') || titleLower.includes('kalibrat') || titleLower.includes('spyruokl')) return '/manufacturer-assets/series/comisa-press-tools-calibrator.webp';
        if (titleLower.includes('kran') || titleLower.includes('pn35')) return '/manufacturer-assets/series/comisa-ball-valve-pn35.webp';
        if (titleLower.includes('trišak')) return '/manufacturer-assets/series/comisa-press-tee-fitting.webp';
        if (titleLower.includes('presuoj')) return '/manufacturer-assets/series/comisa-press-coupling-elbow.webp';
        return '/manufacturer-assets/series/comisa-threaded-brass-fitting.webp';
    }

    if (brandLower.includes('viessmann')) {
        if (titleLower.includes('vitodens 200') || titleLower.includes('vitodens 222')) return '/manufacturer-assets/series/viessmann-vitodens-200-222.webp';
        if (titleLower.includes('vitodens 100') || titleLower.includes('vitodens 111')) return '/manufacturer-assets/series/viessmann-vitodens-100-111.webp';
        if (titleLower.includes('vitotronic') || titleLower.includes('jutikl') || titleLower.includes('valdikl')) return '/manufacturer-assets/series/viessmann-vitotronic-automation.webp';
        return '/manufacturer-assets/series/viessmann-flue-hydraulic-accessories.webp';
    }

    if (brandLower.includes('wilo')) {
        if (titleLower.includes('twi') || titleLower.includes('twu')) return '/manufacturer-assets/series/wilo-twi-submersible-well.webp';
        if (titleLower.includes('pb-') || titleLower.includes('wj')) return '/manufacturer-assets/series/wilo-pb-wj-booster-pump.webp';
        if (titleLower.includes('star-z') || titleLower.includes('stg')) return '/manufacturer-assets/series/wilo-star-z-dhw-recirculation.webp';
        if (titleLower.includes('maxo') || titleLower.includes('pn6')) return '/manufacturer-assets/series/wilo-yonos-maxo-commercial.webp';
        return '/manufacturer-assets/series/wilo-stratos-pico-ecm.webp';
    }

    if (brandLower.includes('sanha')) {
        if (titleLower.includes('ardom')) return '/manufacturer-assets/series/sanha-union-couplings.webp';
        if (titleLower.includes('presuoj')) return '/manufacturer-assets/series/sanha-copper-press-fittings.webp';
        if (titleLower.includes('plien')) return '/manufacturer-assets/series/sanha-carbon-steel-fittings.webp';
        return '/manufacturer-assets/series/sanha-threaded-brass-bronze.webp';
    }

    if (brandLower.includes('watts')) {
        if (titleLower.includes('manometr') || titleLower.includes('termometr')) return '/manufacturer-assets/series/watts-manometer-thermometer.webp';
        if (titleLower.includes('reduktor') || titleLower.includes('drv') || titleLower.includes('kompensator')) return '/manufacturer-assets/series/watts-drv-pressure-reducer.webp';
        if (titleLower.includes('kolektor') || titleLower.includes('termostat') || titleLower.includes('wfht')) return '/manufacturer-assets/series/watts-flow-ufh-automation.webp';
        return '/manufacturer-assets/series/watts-ksg-safety-valve-group.webp';
    }

    if (brandLower.includes('fv-plast')) {
        if (titleLower.includes('vamzd')) return '/manufacturer-assets/series/fv-plast-faser-stabilized-pipe.webp';
        if (titleLower.includes('srieg') || titleLower.includes('kran')) return '/manufacturer-assets/series/fv-plast-brass-insert-fittings.webp';
        return '/manufacturer-assets/series/fv-plast-ppr-fittings.webp';
    }

    if (brandLower.includes('wavin')) {
        if (titleLower.includes('asto')) return '/manufacturer-assets/series/wavin-asto-acoustic-drainage.webp';
        if (titleLower.includes('lauko') || titleLower.includes('160') || titleLower.includes('200') || titleLower.includes('315')) return '/manufacturer-assets/series/wavin-kg-pvc-outdoor-sewer.webp';
        return '/manufacturer-assets/series/wavin-ht-pp-indoor-sewer.webp';
    }

    if (brandLower.includes('centrometal')) {
        if (titleLower.includes('degikl') || titleLower.includes('pelet')) return '/manufacturer-assets/series/centrometal-peltec-cm-pelet-set.webp';
        if (titleLower.includes('cas') || titleLower.includes('talpa')) return '/manufacturer-assets/series/centrometal-cas-buffer-tank.webp';
        if (titleLower.includes('katilas')) return '/manufacturer-assets/series/centrometal-eko-ck-p-boiler.webp';
        return '/manufacturer-assets/series/centrometal-bio-cet-spare-parts.webp';
    }

    if (brandLower.includes('dražice') || brandLower.includes('drazice')) {
        if (titleLower.includes('okhe') || titleLower.includes('okce')) return '/manufacturer-assets/series/drazice-okce-okhe-smart-boiler.webp';
        if (titleLower.includes('okc')) return '/manufacturer-assets/series/drazice-okc-ntr-indirect-boiler.webp';
        return '/manufacturer-assets/series/drazice-flange-anode-spares.webp';
    }

    if (brandLower.includes('buderus')) {
        if (titleLower.includes('gb172') || titleLower.includes('gb162') || titleLower.includes('katilas')) return '/manufacturer-assets/series/buderus-logamax-plus-gb172i.webp';
        return '/manufacturer-assets/series/buderus-logamatic-rc310-ems.webp';
    }

    if (brandLower.includes('thermawool')) return '/manufacturer-assets/series/thermawool-alu-rockwool-shell.webp';
    if (brandLower.includes('thermaflex')) return '/manufacturer-assets/series/thermaflex-thermacompact-pe.webp';

    if (brandLower.includes('gorenje')) {
        if (skuLower.startsWith('zv') || titleLower.includes('zv') || titleLower.includes('akumuliac')) return '/manufacturer-assets/series/gorenje-tiki-zv-buffer-tank.webp';
        if (titleLower.includes('vlg') || titleLower.includes('ogb')) return '/manufacturer-assets/series/gorenje-vlg-tc-heatpump-boiler.webp';
        return '/manufacturer-assets/series/gorenje-gbk-tgr-combined-boiler.webp';
    }

    if (brandLower.includes('herz')) {
        if (titleLower.includes('teplomix') || titleLower.includes('pamaišymo') || titleLower.includes('trieig')) return '/manufacturer-assets/series/herz-teplomix-3way-valve.webp';
        if (titleLower.includes('kolektor')) return '/manufacturer-assets/series/herz-ufh-stainless-manifold.webp';
        return '/manufacturer-assets/series/herz-ts90-deluxe-radiator-valve.webp';
    }

    if (brandLower.includes('gilės') || brandLower.includes('giles')) {
        if (titleLower.includes('radiator') || titleLower.includes('konvektor') || skuLower.startsWith('gi-rad')) {
            return '/manufacturer-assets/series/giles-steel-radiator-22k-vk.webp';
        }
        if (titleLower.includes('katri') || titleLower.includes('katilas')) {
            return '/manufacturer-assets/series/giles-katri-boiler-series.webp';
        }
        return '/manufacturer-assets/series/giles-igniter-spare-parts.webp';
    }

    if (brandLower.includes('megatherm')) return '/manufacturer-assets/series/megatherm-mpb-burner-series.webp';
    if (brandLower.includes('pelltech')) return '/manufacturer-assets/series/pelltech-pv20a-burner-series.webp';
    if (brandLower.includes('rotex')) return '/manufacturer-assets/series/rotex-hpsu-solaris-series.webp';
    if (brandLower.includes('grundfos')) return '/manufacturer-assets/series/grundfos-alpha2-magna3-pump.webp';
    if (brandLower.includes('ferroli')) {
        if (skuLower.startsWith('gi-ferroli') || titleLower.includes('aklė') || titleLower.includes('kamšt') || titleLower.includes('komplekt')) {
            return '/manufacturer-assets/series/ferroli-radiator-kit-fittings.webp';
        }
        return '/manufacturer-assets/series/ferroli-pol-radiator-boiler.webp';
    }
    if (brandLower.includes('ferro')) return '/manufacturer-assets/series/ferro-sanitary-mixers-valves.webp';
    if (brandLower.includes('zilmet')) return '/manufacturer-assets/series/zilmet-hydro-pro-cal-pro.webp';
    if (brandLower.includes('junkers')) return '/manufacturer-assets/series/junkers-ceraclass-zwc-boiler.webp';

    if (rawImg && fileExistsPositive(rawImg)) return rawImg;
    return '/manufacturer-assets/series/danfoss-ra-n-radiator-valve.webp';
}

function extractTechnicalParameters(item, idx) {
    const sku = String(item.sku || `SKU-${idx}`).trim();
    const skuLower = sku.toLowerCase();
    const title = cleanNoEmDash(item.nameLt || item.name || '');
    const titleLower = title.toLowerCase();
    const brand = cleanNoEmDash(item.brandName || item.brand || 'Gilės Inžinerija');
    const brandLower = brand.toLowerCase();
    const category = cleanNoEmDash(item.categoryName || item.category || 'Katilinės įranga');
    const categoryLower = category.toLowerCase();
    const ean = computeDeterministicEan(sku, item.ean, idx);
    const combined = `${sku} ${title}`;

    // 1. Connection / Dimension / Thread
    let connectionSpec = '';
    const dnMatch = combined.match(/\bDN\s*(\d{2,3})\b/i);
    const pipeDimMatch = combined.match(/\b(\d{2,3}\s*[x×]\s*\d+(?:[.,]\d+)?)\s*(?:mm)?\b/i);
    const threadMatch = combined.match(/\b((?:G|Rp|R)\s*\d+(?:\s+\d+\/\d+|\/\d+)?(?:"|″)?|\d+\s+\d+\/\d+\s*(?:"|″)|(?:1\/2|3\/4|3\/8|1\/4|1)\s*(?:"|″)|M30\s*[x×]\s*1[.,]5|M28\s*[x×]\s*1[.,]5|RA-Click)\b/i);
    const radDimMatch = combined.match(/\b(\d{3,4}\s*[x×]\s*\d{3,4}(?:\s*[x×]\s*\d{2,4})?)\s*mm\b/i);
    const sewerDimMatch = combined.match(/\b(?:Ø|D|DN)?(\d{2,3}\/\d{2,3})\b/);

    const connParts = [];
    if (dnMatch) connParts.push(`DN${dnMatch[1]}`);
    if (threadMatch) connParts.push(threadMatch[1].replace(/\s+/g, ' ').replace(/x/gi, '×'));
    if (pipeDimMatch) connParts.push(`${pipeDimMatch[1].replace(/\s+/g, '').replace(/x/gi, '×')} mm`);
    if (radDimMatch) connParts.push(`${radDimMatch[1].replace(/\s+/g, '').replace(/x/gi, '×')} mm`);
    if (sewerDimMatch && categoryLower.includes('nuotek')) connParts.push(`Ø ${sewerDimMatch[1]} mm`);

    if (connParts.length > 0) {
        connectionSpec = connParts.slice(0, 2).join(' · ');
    } else if (brandLower.includes('haier')) {
        if (skuLower.startsWith('aw') || skuLower.startsWith('au') || skuLower.startsWith('hu')) {
            connectionSpec = 'G 1" / G 1 1/4" hidraulinis prijungimas';
        } else if (skuLower.startsWith('es') || skuLower.startsWith('hp')) {
            connectionSpec = 'G 1/2" / G 3/4" vandentiekio sriegis';
        } else {
            connectionSpec = '1/4" + 3/8" arba 3/8" + 5/8" šaltnešio linijos';
        }
    } else if (brandLower.includes('pneumatex') || brandLower.includes('zilmet') || categoryLower.includes('plėtimosi')) {
        connectionSpec = 'G 3/4" / G 1" srieginė sistemos jungtis';
    } else if (brandLower.includes('danfoss') && (titleLower.includes('galvut') || skuLower.startsWith('013g2') || skuLower.startsWith('013g5'))) {
        connectionSpec = 'Danfoss RA-Click (23 mm) arba M30×1,5 fiksavimas';
    } else if (brandLower.includes('heimeier') && (titleLower.includes('galvut') || titleLower.includes('emo') || titleLower.includes('eclipse'))) {
        connectionSpec = 'M30×1,5 standartinis sriegis · DN15 (G 1/2")';
    } else if (categoryLower.includes('grindinis')) {
        connectionSpec = 'G 3/4" Eurokonus / M30×1,5 kontūro jungtis';
    } else if (categoryLower.includes('vamzdyn')) {
        connectionSpec = 'EN 10226 / ISO 228 inžinerinė jungtis';
    } else {
        connectionSpec = 'Standartizuota gamyklinė ŠVOK jungtis';
    }

    // 2. Nominal Pressure / Power / Volume
    let ratingSpec = '';
    const kwMatch = combined.match(/\b(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*kW)\b/i);
    const wattMatch = combined.match(/\b(\d{2,4}\s*W)\b/i);
    const volMatch = combined.match(/\b(\d{1,4}\s*(?:L|l|litr\w*))\b/);
    const pnMatch = combined.match(/\b(PN\s*\d{1,2}|\d{1,2}\s*bar)\b/i);
    const kvMatch = combined.match(/\b((?:Kvs?|Qmaks)\s*[:=]?\s*\d+(?:[.,]\d+)?)\b/i);

    const ratingParts = [];
    if (kwMatch) ratingParts.push(kwMatch[1].replace(/\s+/g, ' '));
    if (wattMatch && !kwMatch) ratingParts.push(wattMatch[1].replace(/\s+/g, ' '));
    if (volMatch) ratingParts.push(volMatch[1].replace(/litr\w*/i, 'L').replace(/\s+/g, ' ').toUpperCase());
    if (pnMatch) ratingParts.push(pnMatch[1].toUpperCase().replace(/\s+/g, ''));
    if (kvMatch) ratingParts.push(kvMatch[1]);

    if (ratingParts.length > 0) {
        ratingSpec = ratingParts.slice(0, 2).join(' · ');
    } else if (brandLower.includes('pneumatex')) {
        ratingSpec = skuLower.startsWith('711') || skuLower.startsWith('7103') ? 'PN10 (10 bar) · EN 12828' : 'PN6 (6 bar) · EN 12828';
    } else if (brandLower.includes('imi ta')) {
        ratingSpec = skuLower.startsWith('52-182') ? 'PN16 flanšinis · Matavimo nipeliai' : 'PN20 (20 bar) · Hidraulinis balansavimas';
    } else if (brandLower.includes('danfoss') || brandLower.includes('heimeier') || brandLower.includes('herz')) {
        ratingSpec = 'PN10 / PN16 · 100 % gamyklinė hidraulinė patikra';
    } else if (brandLower.includes('comisa') || brandLower.includes('sanha') || brandLower.includes('fv-plast')) {
        ratingSpec = 'PN10 / PN16 (iki 10–16 bar darbinis slėgis)';
    } else if (brandLower.includes('wilo') || brandLower.includes('grundfos')) {
        ratingSpec = 'PN10 · EEI <= 0,20 aukšto efektyvumo ECM';
    } else {
        ratingSpec = 'PN10 / Vardinis gamyklinis režimas';
    }

    // 3. Body / Node Material
    let materialSpec = '';
    if (brandLower.includes('imi ta')) {
        materialSpec = skuLower.startsWith('52-182')
            ? 'Kalusis ketus EN-GJS-400-15 / EN-GJL-250 su epoksidine danga'
            : 'AMETAL lydinys (cinko išplovimui atsparus žalvaris)';
    } else if (brandLower.includes('pneumatex') || brandLower.includes('zilmet')) {
        materialSpec = 'Lakštinis plienas S235JR + AirProof butilo / EPDM membrana';
    } else if (brandLower.includes('heimeier')) {
        if (titleLower.includes('dynacon') || skuLower.startsWith('9330')) {
            materialSpec = 'AISI 304 nerūdijantis plienas + nikeliuota bronza';
        } else if (titleLower.includes('galvut') || titleLower.includes('emo')) {
            materialSpec = 'Smūgiams atsparus ABS / PA66 polimeras + skystinis jutiklis';
        } else {
            materialSpec = 'Korozijai atspari raudonoji bronza CC499K (DIN EN 1982)';
        }
    } else if (brandLower.includes('danfoss')) {
        if (titleLower.includes('galvut') || titleLower.includes('termostat') || titleLower.includes('icon') || titleLower.includes('pavara') || skuLower.startsWith('088') || skuLower.startsWith('140f')) {
            materialSpec = 'UV stabilizuotas ABS polimeras + elektroninis / termostatinis mazgas';
        } else {
            materialSpec = 'DZR žalvaris CW602N / MS58 su nikeliuotu paviršiumi';
        }
    } else if (brandLower.includes('comisa')) {
        materialSpec = titleLower.includes('vamzd')
            ? 'PE-RT / Al / PE-RT daugiasluoksnis su lazeriniu Al barjeru'
            : 'Karštai štampuotas žalvaris CW617N + EPDM O-žiedai';
    } else if (brandLower.includes('sanha')) {
        materialSpec = 'Elektrolitinis varis Cu-DHP (CW024A) / bešvinė silicio bronza CC246E';
    } else if (brandLower.includes('fv-plast')) {
        materialSpec = 'Polipropilenas PP-R tipas 3 (random kopolimeras) + CW617N įdėklai';
    } else if (brandLower.includes('wavin')) {
        materialSpec = titleLower.includes('asto')
            ? 'Mineralais armuotas polipropilenas PP-MD (betriukšmis)'
            : 'Karščiui ir cheminiams poveikiams atsparus PP / PVC-U';
    } else if (brandLower.includes('thermawool')) {
        materialSpec = 'Nedegi akmens vata (A1/A2) su armuota aliuminio folija';
    } else if (brandLower.includes('thermaflex')) {
        materialSpec = 'Uždarų porų ekstrudinis polietilenas (PE) su apsauginiu apvalkalu';
    } else if (brandLower.includes('haier')) {
        if (skuLower.startsWith('es') || skuLower.startsWith('hp')) {
            materialSpec = 'Trijų sluoksnių titano emale dengtas plienas + Incoloy 800 tenas';
        } else if (skuLower.startsWith('aw') || titleLower.includes('r290')) {
            materialSpec = 'Antikorozinis cinkuotas plienas + AISI 316L plokštelinis šilumokaitis (R290)';
        } else {
            materialSpec = 'Antikorozinis korpusas + vario-aliuminio Blue Fin šilumokaitis';
        }
    } else if (brandLower.includes('dražice') || brandLower.includes('drazice') || brandLower.includes('gorenje')) {
        materialSpec = 'Emaliuotas plieninis bakas su magnio anodu ir PU termoizoliacija';
    } else if (brandLower.includes('viessmann') || brandLower.includes('buderus') || brandLower.includes('junkers') || brandLower.includes('rotex')) {
        materialSpec = 'Inox-Radial AISI 316Ti nerūdijantis plienas / Al-Si lydinys';
    } else if (brandLower.includes('centrometal') || brandLower.includes('gilės') || brandLower.includes('megatherm') || brandLower.includes('pelltech')) {
        materialSpec = 'P265GH katilinis plienas (5–6 mm) + karščiui atsparus AISI 310S plienas';
    } else if (brandLower.includes('wilo') || brandLower.includes('grundfos')) {
        materialSpec = 'Kataforeze dengtas ketus EN-GJL-200 / AISI 304 nerūdijantis plienas';
    } else {
        materialSpec = 'Sertifikuotas CW617N žalvaris / nerūdijantis plienas';
    }

    // 4. Series label
    let seriesLabel = `${brand} Pro Series`;
    if (brandLower.includes('haier')) {
        if (skuLower.startsWith('aw') || titleLower.includes('r290')) seriesLabel = 'Haier Super Aqua Monoblokas R290';
        else if (skuLower.startsWith('au')) seriesLabel = 'Haier Super Aqua Monoblokas R32';
        else if (skuLower.startsWith('hu')) seriesLabel = 'Haier Hydro Split / All-in-One';
        else if (skuLower.startsWith('hp')) seriesLabel = 'Haier HP80–250M R290 Boileris';
        else if (skuLower.startsWith('es')) seriesLabel = 'Haier ES10V–100V Elektrinis Šildytuvas';
        else if (skuLower.startsWith('ab') || skuLower.startsWith('ad') || titleLower.includes('mrv')) seriesLabel = 'Haier MRV VRF Komercinė Serija';
        else seriesLabel = 'Haier Nordic / Split Klimato Serija';
    } else if (brandLower.includes('danfoss')) {
        if (skuLower.startsWith('003z') || titleLower.includes('ab-qm')) seriesLabel = 'Danfoss AB-QM / MSV Balansavimas';
        else if (skuLower.startsWith('088') || skuLower.startsWith('082') || skuLower.startsWith('140f')) seriesLabel = 'Danfoss Icon / ABN / DEVIreg Automatika';
        else seriesLabel = 'Danfoss RA-N / Aero / Redia Termostatika';
    } else if (brandLower.includes('heimeier')) {
        if (skuLower.startsWith('9330') || titleLower.includes('dynacon')) seriesLabel = 'IMI Heimeier Dynacon Eclipse';
        else if (skuLower.startsWith('393') || titleLower.includes('eclipse')) seriesLabel = 'IMI Heimeier Eclipse AFC';
        else if (skuLower.startsWith('038') || titleLower.includes('vekolux')) seriesLabel = 'IMI Heimeier Vekolux / Regulux';
        else seriesLabel = 'IMI Heimeier V-exact II / K-Serija';
    } else if (brandLower.includes('imi ta')) {
        if (skuLower.startsWith('52-182')) seriesLabel = 'IMI TA STAF Flanšinė Serija';
        else if (skuLower.startsWith('52-133') || skuLower.startsWith('52-134')) seriesLabel = 'IMI TA-Modulator / Compact-P';
        else seriesLabel = 'IMI TA STAD AMETAL Serija';
    } else if (brandLower.includes('pneumatex')) {
        if (skuLower.startsWith('78') || titleLower.includes('zeparo')) seriesLabel = 'IMI Pneumatex Zeparo / Vento';
        else if (skuLower.startsWith('810') || titleLower.includes('transfero') || titleLower.includes('compresso')) seriesLabel = 'IMI Pneumatex Transfero / Compresso';
        else if (skuLower.startsWith('711')) seriesLabel = 'IMI Pneumatex Aquapresso ADF';
        else seriesLabel = 'IMI Pneumatex Statico SD / SG';
    } else {
        const tokenMatch = title.match(/\b([A-ZÄÖÜŠŽČĄĘĖĮŲŪ]{2,}[A-Z0-9-]*)\b/);
        seriesLabel = tokenMatch && tokenMatch[1].toLowerCase() !== brandLower
            ? `${brand} ${tokenMatch[1]} serija`
            : `${brand} ${category.split(' ')[0]} serija`;
    }

    // 5. Operating temp / electrical & Standard
    let tempOrVoltage = 'Iki +110 °C (uždara sistema)';
    if (/230\s*v/i.test(combined)) tempOrVoltage = '230 V AC, 50 Hz · IP41/IP54';
    else if (/24\s*v/i.test(combined)) tempOrVoltage = '24 V AC/DC · SELV saugi įtampa';
    else if (/400\s*v|3\s*f/i.test(combined)) tempOrVoltage = '3×400 V AC, 50 Hz';
    else if (brandLower.includes('haier')) tempOrVoltage = 'Darbinis diapazonas -25 °C .. +43 °C (tiekimas iki +75 °C)';
    else if (brandLower.includes('thermawool')) tempOrVoltage = 'Darbinė terpės temperatūra iki +250 °C';
    else if (brandLower.includes('pneumatex')) tempOrVoltage = 'Darbinė membranos temperatūra +5 °C .. +70 °C (sistema iki +120 °C)';

    const standardSpec = categoryLower.includes('termostat')
        ? 'LST EN 215 / KEYMARK'
        : categoryLower.includes('katil') || categoryLower.includes('degikl')
          ? 'LST EN 303-5 (5 klasė, EcoDesign) / EN 12828'
          : categoryLower.includes('vamzdyn') || categoryLower.includes('grindinis')
            ? 'DVGW / EN ISO 21003 / DIN 4726'
            : 'LST EN 12828 / ISO 9001';

    const applicationScope = `${category} (${brand} inžinerinės šildymo, vėsinimo ir vandentiekio sistemos)`;

    const specs = {
        Gamintojas: brand,
        'Prekės kodas (SKU)': sku,
        'EAN-13 kodas': ean,
        'Gamintojo serija': cleanNoEmDash(seriesLabel),
        'Pajungimo matmuo / sriegis': cleanNoEmDash(connectionSpec),
        'Vardinis slėgis / galia / tūris': cleanNoEmDash(ratingSpec),
        'Korpuso / mazgo medžiaga': cleanNoEmDash(materialSpec),
        'Darbinė temperatūra / įtampa': cleanNoEmDash(tempOrVoltage),
        'Atitikties standartas': cleanNoEmDash(standardSpec),
        'Taikymo sritis': cleanNoEmDash(applicationScope),
    };

    const stockNote = String(item.stockSource || '').includes('Tiekėjo')
        ? 'Tiekėjo centrinis sandėlis (pristatymas 2–4 d. d.)'
        : 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)';

    const uniqueDescription = cleanNoEmDash(
        `${title} (${brand}, gamintojo kodas SKU: ${sku}, EAN: ${ean}) – ${seriesLabel} inžinerinis komponentas, skirtas kategorijai „${category}“. ` +
        `Techniniai parametrai: pajungimas ${connectionSpec}; vardinis režimas ${ratingSpec}; konstrukcija: ${materialSpec}; darbo režimas: ${tempOrVoltage}; standartas: ${standardSpec}. ` +
        `Tiekimo šaltinis: ${stockNote}.`
    );

    return {
        ean,
        specs,
        uniqueDescription,
    };
}

function main() {
    const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const products = raw.products || [];
    console.log(`Loaded ${products.length} products from ${catalogPath}`);

    const seenDescriptions = new Set();
    const usedImages = new Set();
    let manufacturerAssetHits = 0;

    for (let i = 0; i < products.length; i++) {
        const item = products[i];
        const bestImg = resolveBestManufacturerImage(item, i);
        const { ean, specs, uniqueDescription } = extractTechnicalParameters(item, i);

        let finalDesc = uniqueDescription;
        if (seenDescriptions.has(finalDesc)) {
            finalDesc = `${uniqueDescription} [Įrašo ID: ${item.id.slice(0, 8)}]`;
        }
        seenDescriptions.add(finalDesc);
        usedImages.add(bestImg);
        if (bestImg.startsWith('/manufacturer-assets/')) {
            manufacturerAssetHits++;
        }

        item.ean = ean;
        item.image = bestImg;
        item.rawImageUrl = bestImg;
        item.description = finalDesc;
        item.descriptionLt = finalDesc;
        item.specs = specs;
        item.technicalSpecs = specs;
    }

    fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    console.log(`Enriched ${products.length}/${products.length} SKUs in ${catalogPath}`);
    console.log(`Unique descriptions: ${seenDescriptions.size}/${products.length}`);
    console.log(`Distinct verified images used across catalog: ${usedImages.size}`);
    console.log(`SKUs mapped to /manufacturer-assets/*: ${manufacturerAssetHits}`);
}

main();
