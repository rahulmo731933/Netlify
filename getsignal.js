exports.handler = async(event) => {

    const body =
    JSON.parse(event.body);

    const candles =
    body.candles;

    // ===== YOUR SECRET STRATEGY =====
    function calculateEMA(prices, period){

    const k =
    2/(period+1);

    let ema =
    prices[0];

    for(let i=1;i<prices.length;i++){

        ema =
        prices[i]*k +
        ema*(1-k);

    }

    return ema;
}

function calculateRSI(prices, period=14){

    let gains = 0;
    let losses = 0;

    for(let i=1;i<=period;i++){

        const diff =
        prices[i]-prices[i-1];

        if(diff>0)
            gains+=diff;
        else
            losses-=diff;
    }

    const rs =
    gains/(losses||1);

    return 100-
    (100/(1+rs));
}

function analyzeMarket(candles){

    const closes =
    candles.map(
    c => parseFloat(c.close)
    );

    const ema9 =
    calculateEMA(closes,9);

    const ema21 =
    calculateEMA(closes,21);

    const ema50 =
    calculateEMA(closes,50);

    const rsi =
    calculateRSI(
    closes.slice(-15)
    );

    const last =
    closes[closes.length-1];
    
    const currentPrice =
    last;

    const prev =
    closes[closes.length-2];

    let callScore = 0;
    let putScore = 0;
    
    const lastCandle =
candles[candles.length-1];

const prevCandle =
candles[candles.length-2];

    /* TREND */

    if(ema9 > ema21)
        callScore += 30;

    if(ema21 > ema50)
        callScore += 25;

    if(ema9 < ema21)
        putScore += 30;

    if(ema21 < ema50)
        putScore += 25;

    /* RSI */

    if(rsi > 55 && rsi < 75)
        callScore += 25;

    if(rsi < 45 && rsi > 25)
        putScore += 25;

    /* MOMENTUM */

    if(last > prev)
        callScore += 20;

    if(last < prev)
        putScore += 20;
        
    /* ENGULFING */

const bullishEngulf =
parseFloat(lastCandle.close) >
parseFloat(prevCandle.open) &&
parseFloat(lastCandle.open) <
parseFloat(prevCandle.close);

const bearishEngulf =
parseFloat(lastCandle.close) <
parseFloat(prevCandle.open) &&
parseFloat(lastCandle.open) >
parseFloat(prevCandle.close);

if(bullishEngulf)
    callScore += 25;

if(bearishEngulf)
    putScore += 25;
    
    /* TREND STRENGTH */

const trendStrength =
Math.abs(ema9 - ema50);

if(trendStrength > 0.00030){

    callScore += 20;
    putScore += 20;

}

    /* STRONG BREAK */

    if(
       last > prev &&
       ema9 > ema21
    )
        callScore += 10;

    if(
       last < prev &&
       ema9 < ema21
    )
        putScore += 10;
        
    /* REJECTION WICK */

const high =
parseFloat(lastCandle.high);

const low =
parseFloat(lastCandle.low);

const open =
parseFloat(lastCandle.open);

const close =
parseFloat(lastCandle.close);

const upperWick =
high - Math.max(open,close);

const lowerWick =
Math.min(open,close) - low;

if(
    lowerWick >
    Math.abs(close-open)*1.5
){
    callScore += 20;
}

if(
    upperWick >
    Math.abs(close-open)*1.5
){
    putScore += 20;
}

/* ATR VOLATILITY FILTER */

let atr = 0;

for(let i=1;i<15;i++){

    atr += Math.abs(
    closes[closes.length-i] -
    closes[closes.length-i-1]
    );

}

atr /= 14;

if(atr < 0.00008){

    displaySignal(
        "NO SIGNAL",
        0,
        ema9,
        ema21,
        ema50,
        rsi,
        "LOW VOLATILITY",
        currentPrice
    );

    return;
}

    /* RANGE FILTER */

    if(
       Math.abs(ema9 - ema21)
       <
       0.00005
    ){

        displaySignal(
            "NO SIGNAL",
            0,
            ema9,
            ema21,
            ema50,
            rsi,
            "RANGING"
        );

        return;
    }

    let signal =
    "NO SIGNAL";

    let strength =
    0;

    let trend =
    "SIDEWAYS";

    if(callScore >= 120){

        signal =
        "CALL";

        strength =
        callScore;

        trend =
        "BULLISH";

    }
    else if(putScore >= 120){

        signal =
        "PUT";

        strength =
        putScore;

        trend =
        "BEARISH";

    }

    displaySignal(
        signal,
        strength,
        ema9,
        ema21,
        ema50,
        rsi,
        trend,
        currentPrice
    );

    const tf =
    parseInt(
    document.getElementById(
    "timeframe"
    ).value
    );

    //startCooldown(tf);

}



    let signal = "CALL";
    let score = 95;

    return {
        statusCode:200,
        body:JSON.stringify({
            signal,
            score
        })
    };

};