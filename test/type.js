import * as I from "infestines"
import * as R from "ramda"

export const lazy = ty2ty => {
  let memo = x => {
    memo = ty2ty(rec)
    return memo(x)
  }
  const rec = x => memo(x)
  return rec
}

export const any = x => x

export const and = R.pipe

export const or = (...ps) => x => {
  const es = [], n = ps.length
  for (let i=0; i<n; ++i) {
    try {
      return ps[i](x)
    } catch (e) {
      es.push([ps[i], e])
    }
  }
  throw Error(`or(${ps}): ${x}`)
}

export const fromPredicate = p => x => {
  if (p(x))
    return x
  throw Error(`fromPredicate(${p}): ${x}`)
}

const type = t => fromPredicate(x => typeof x === t)
export const instanceOf = c => fromPredicate(x => x instanceof c)

const isFreezable = x => I.isArray(x) || I.isObject(x)
const isFrozen = x => !isFreezable(x) || Object.isFrozen(x)
const isDeepFrozen = x =>
  !isFreezable(x)
  || Object.isFrozen(x)
     && !Object.getOwnPropertyNames(x).find(x => !isDeepFrozen(x))

export const frozen = fromPredicate(isFrozen)

export const deepFrozen = fromPredicate(isDeepFrozen)

export const deepFreeze = x => isFrozen(x) ? x
  : (Object.getOwnPropertyNames(x).forEach(k => deepFreeze(x[k])),
     Object.freeze(x))

export const integer = fromPredicate(Number.isInteger)
export const nonNegative = and(integer, fromPredicate(x => 0 <= x))

export const boolean = type("boolean")
export const number = type("number")
export const string = type("string")
export const undef = fromPredicate(x => x === undefined)
export const def = fromPredicate(x => x !== undefined)

export const array = ty => and(instanceOf(Array), R.map(ty))

export const arity = n => fromPredicate(x => x.length === n)

export const props = R.map

export const object = template => object => {
  const result = {}
  if (!I.isObject ||
      !I.hasKeysOfU(template, object) ||
      !I.hasKeysOfU(object, template))
    throw Error(`object(${template}): ${object}`)
  for (const k in template)
    result[k] = template[k](object[k])
  return result
}

export const fn = (argTys, resultTy) => {
  if (!(argTys instanceof Array))
    throw Error(`fn arg types must be an array, given ${argTys}`)
  return fn => {
    if (typeof fn !== "function" || argTys.length < fn.length)
      throw Error(`fn(${argTys}, ${resultTy}): ${fn}`)
    return R.curryN(argTys.length, function (...argIns) {
      if (argTys.length !== argIns.length)
        throw Error(`fn(${argTys}, ${resultTy}): got ${argIns.length} args`)
      const n=argIns.length, args=Array(n)
      for (let i=0; i<n; ++i)
        args[i] = argTys[i](argIns[i])
      return resultTy(fn.apply(this, args))
    })
  }
}

export const fnVar = (argsTy, resultTy) => fn => {
  if (typeof fn !== "function")
    throw Error(`fnVar(${argsTy}, ${resultTy}): ${fn}`)
  return function (...argIns) {
    const n=argIns.length, args=Array(n)
    for (let i=0; i<n; ++i)
      args[i] = argsTy(argIns[i])
    return resultTy(fn.apply(this, args))
  }
}
