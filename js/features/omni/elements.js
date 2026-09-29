// ============================================================
// Elements - use quark to buy 118 elements
// ============================================================

const ELEMENT_EFFECT_TYPES = [
    { id: 'antiFish',  base: 1.05  },
    { id: 'transcend', base: 1.02  },
    { id: 'undead',    base: 1.02  },
    { id: 'nucleus',   base: 1.02  },
    { id: 'runeFrag',  base: 1.02  },
    { id: 'gameSpeed', base: 1.005 },
]

const ELEMENTS = {
    get purchased() { return player.omni.elements },
    get count()     { return this.purchased.length },

    get cost() {
        const i = this.count + 1
        if (i > 118) return EINF
        return Decimal.pow(10, Decimal.pow(i, 0.8)).max(1).floor()
    },

    purchase() {
        if (this.count >= 118) return
        const cost = this.cost
        if (player.omni.quarks.gte(cost)) {
            player.omni.quarks = player.omni.quarks.sub(cost)
            this.purchased.push(this.count + 1)
        }
    },

    has(id) { return this.purchased.includes(id) },

    getEffect(id) {
        const idx  = (id - 1) % ELEMENT_EFFECT_TYPES.length
        const tier = Math.floor((id - 1) / ELEMENT_EFFECT_TYPES.length) + 1
        const type = ELEMENT_EFFECT_TYPES[idx]
        return {
            type:  type.id,
            value: Decimal.pow(type.base, tier),
        }
    },

    getEffects() {
        const effects = {
            antiFish:  E(1),
            transcend: E(1),
            undead:    E(1),
            nucleus:   E(1),
            runeFrag:  E(1),
            gameSpeed: E(1),
        }
        if (!player.omni || !player.omni.elements) return effects
        for (const id of this.purchased) {
            const e = this.getEffect(id)
            effects[e.type] = effects[e.type].mul(e.value)
        }
        return effects
    },

    get godCapBonus() { return this.count },

    get quarkGain() {
        const f = player.fish.max(10)
        const x = f.log10().log10().max(1)
        if (isNaN(x.mag)) return E(1)
        return x.floor()
    },
}

// ============================ UI ============================

function setupElementsHTML() {
    let h = ''
    for (let i = 1; i <= 118; i++) {
        h += `<button class="element-btn" id="element-btn-${i}" onclick="ELEMENTS.purchase()">
            <div class="element-symbol">${ELEMENT_SYMBOLS[i]}</div>
            <div class="element-name" id="element-name-${i}"></div>
            <div class="element-id">#${i}</div>
        </button>`
    }
    el('elements-grid').innerHTML = h

    const names = lang_text('full-element-name')
    for (let i = 1; i <= 118; i++) {
        el(`element-name-${i}`).textContent = names[i] ?? ELEMENT_SYMBOLS[i]
    }
}

function updateElementsHTML() {
    const count  = ELEMENTS.count
    const nextId = count + 1

    const showUntil = Math.min(count + 8, 118)

    for (let i = 1; i <= 118; i++) {
        const e = el(`element-btn-${i}`)
        if (!e) continue
        e.style.display = (i <= showUntil) ? '' : 'none'
        e.className = el_classes({
            'element-btn': true,
            'bought': ELEMENTS.has(i),
            'locked': i === nextId && player.omni.quarks.lt(ELEMENTS.cost),
        })
    }

    const nextEffect = count < 118 ? ELEMENTS.getEffect(count + 1) : null
    const quarkGain  = ELEMENTS.quarkGain

    const text = {
        purchased:  lang_text('elements-purchased'),
        quarks:     lang_text('elements-quarks'),
        nextCost:   lang_text('elements-next-cost'),
        nextEffect: lang_text('elements-next-effect'),
        godCap:     lang_text('elements-god-cap'),
        allBought:  lang_text('elements-all-bought'),
        nextQuark:  lang_text('elements-next-quark'),
    }

    let html = `<p><b>${text.purchased}:</b> ${count} / 118</p>`
    html += `<p><b>${text.quarks}:</b> ${format(player.omni.quarks, 2)}${quarkGain.gt(0) ? ` <span style="color:lime">(${text.nextQuark} +${format(quarkGain,0)})</span>` : ""}</p>`
    html += `<p><b>${text.nextCost}:</b> ${count < 118 ? format(ELEMENTS.cost, 2) : text.allBought}</p>`
    if (nextEffect) {
        html += `<p><b>${text.nextEffect}:</b> ${lang_text('element-effect-' + nextEffect.type)} ×${format(nextEffect.value, 3)}</p>`
    }
    html += `<p><b>${text.godCap}:</b> +${ELEMENTS.godCapBonus}</p>`

    el('elements-info').innerHTML = html
}