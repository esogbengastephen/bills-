import { NextRequest, NextResponse } from 'next/server'
import { clubKonnectService } from '@/lib/clubkonnect'
import { mapClubKonnectError, getUserFriendlyMessage } from '@/lib/clubkonnect-errors'
import { logger } from '@/lib/logger'

// Real ClubKonnect data plans from API documentation
const CLUBKONNECT_DATA_PLANS = {
  mtn: [
    // SME Plans (30 days)
    { variation_code: '500.0', name: '500 MB - 30 days (SME)', variation_amount: '500.0' },
    { variation_code: '1000.0', name: '1 GB - 30 days (SME)', variation_amount: '1000.0' },
    { variation_code: '2000.0', name: '2 GB - 30 days (SME)', variation_amount: '2000.0' },
    { variation_code: '3000.0', name: '3 GB - 30 days (SME)', variation_amount: '3000.0' },
    { variation_code: '5000.0', name: '5 GB - 30 days (SME)', variation_amount: '5000.0' },
    
    // Daily Plans (Awoof Data)
    { variation_code: '100.01', name: '110MB Daily Plan - 1 day (Awoof Data)', variation_amount: '100.01' },
    { variation_code: '200.01', name: '230MB Daily Plan - 1 day (Awoof Data)', variation_amount: '200.01' },
    { variation_code: '350.01', name: '500MB Daily Plan - 1 day (Awoof Data)', variation_amount: '350.01' },
    { variation_code: '500.01', name: '1GB Daily Plan + 1.5mins. - 1 day (Awoof Data)', variation_amount: '500.01' },
    { variation_code: '750.01', name: '2.5GB Daily Plan - 1 day (Awoof Data)', variation_amount: '750.01' },
    
    // 2-Day Plans
    { variation_code: '900.01', name: '2.5GB 2-Day Plan - 2 days (Awoof Data)', variation_amount: '900.01' },
    { variation_code: '1000.01', name: '3.2GB 2-Day Plan - 2 days (Awoof Data)', variation_amount: '1000.01' },
    
    // Weekly Plans (Direct Data)
    { variation_code: '500.02', name: '500MB Weekly Plan - 7 days (Direct Data)', variation_amount: '500.02' },
    { variation_code: '800.01', name: '1GB Weekly Plan - 7 days (Direct Data)', variation_amount: '800.01' },
    { variation_code: '2500.01', name: '6GB Weekly Plan - 7 days (Direct Data)', variation_amount: '2500.01' },
    { variation_code: '3500.01', name: '11GB Weekly Bundle - 7 days (Direct Data)', variation_amount: '3500.01' },
    { variation_code: '5000.01', name: '20GB Weekly Plan - 7 days (Direct Data)', variation_amount: '5000.01' },
    
    // Monthly Plans (Direct Data)
    { variation_code: '1500.02', name: '2GB+2mins Monthly Plan - 30 days (Direct Data)', variation_amount: '1500.02' },
    { variation_code: '2000.01', name: '2.7GB+2mins Monthly Plan - 30 days (Direct Data)', variation_amount: '2000.01' },
    { variation_code: '2500.02', name: '3.5GB+5mins Monthly Plan - 30 days (Direct Data)', variation_amount: '2500.02' },
    { variation_code: '3500.02', name: '7GB Monthly Plan - 30 days (Direct Data)', variation_amount: '3500.02' },
    { variation_code: '4500.01', name: '10GB+10mins Monthly Plan - 30 days (Direct Data)', variation_amount: '4500.01' },
    { variation_code: '5500.01', name: '12.5GB Monthly Plan - 30 days (Direct Data)', variation_amount: '5500.01' },
    { variation_code: '6500.01', name: '16.5GB+10mins Monthly Plan - 30 days (Direct Data)', variation_amount: '6500.01' },
    { variation_code: '7500.01', name: '20GB Monthly Plan - 30 days (Direct Data)', variation_amount: '7500.01' },
    { variation_code: '9000.01', name: '25GB Monthly Plan - 30 days (Direct Data)', variation_amount: '9000.01' },
    { variation_code: '11000.01', name: '36GB Monthly Plan - 30 days (Direct Data)', variation_amount: '11000.01' },
    { variation_code: '18000.01', name: '75GB Monthly Plan - 30 days (Direct Data)', variation_amount: '18000.01' },
    { variation_code: '35000.01', name: '165GB Monthly Plan - 30 days (Direct Data)', variation_amount: '35000.01' },
    
    // Multi-Month Plans
    { variation_code: '40000.01', name: '150GB 2-Month Plan - 60 days (Direct Data)', variation_amount: '40000.01' },
    { variation_code: '90000.03', name: '480GB 3-Month Plan - 90 days (Direct Data)', variation_amount: '90000.03' }
  ],
  airtel: [
    // Awoof Data Plans (shorter durations)
    { variation_code: '499.91', name: '1GB - 1 day (Awoof Data)', variation_amount: '499.91' },
    { variation_code: '599.91', name: '1.5GB - 2 days (Awoof Data)', variation_amount: '599.91' },
    { variation_code: '749.91', name: '2GB - 2 days (Awoof Data)', variation_amount: '749.91' },
    { variation_code: '999.91', name: '3GB - 2 days (Awoof Data)', variation_amount: '999.91' },
    { variation_code: '1499.91', name: '5GB - 2 days (Awoof Data)', variation_amount: '1499.91' },
    
    // Direct Data Plans (7-day duration)
    { variation_code: '499.92', name: '500MB - 7 days (Direct Data)', variation_amount: '499.92' },
    { variation_code: '799.91', name: '1GB - 7 days (Direct Data)', variation_amount: '799.91' },
    { variation_code: '999.92', name: '1.5GB - 7 days (Direct Data)', variation_amount: '999.92' },
    { variation_code: '1499.92', name: '3.5GB - 7 days (Direct Data)', variation_amount: '1499.92' },
    { variation_code: '2499.91', name: '6GB - 7 days (Direct Data)', variation_amount: '2499.91' },
    { variation_code: '2999.91', name: '10GB - 7 days (Direct Data)', variation_amount: '2999.91' },
    { variation_code: '4999.91', name: '18GB - 7 days (Direct Data)', variation_amount: '4999.91' },
    
    // Direct Data Plans (30-day duration)
    { variation_code: '1499.93', name: '2GB - 30 days (Direct Data)', variation_amount: '1499.93' },
    { variation_code: '1999.91', name: '3GB - 30 days (Direct Data)', variation_amount: '1999.91' },
    { variation_code: '2499.92', name: '4GB - 30 days (Direct Data)', variation_amount: '2499.92' },
    { variation_code: '2999.92', name: '8GB - 30 days (Direct Data)', variation_amount: '2999.92' },
    { variation_code: '3999.91', name: '10GB - 30 days (Direct Data)', variation_amount: '3999.91' },
    { variation_code: '4999.92', name: '13GB - 30 days (Direct Data)', variation_amount: '4999.92' },
    { variation_code: '5999.91', name: '18GB - 30 days (Direct Data)', variation_amount: '5999.91' },
    { variation_code: '7999.91', name: '25GB - 30 days (Direct Data)', variation_amount: '7999.91' },
    { variation_code: '9999.91', name: '35GB - 30 days (Direct Data)', variation_amount: '9999.91' },
    { variation_code: '14999.91', name: '60GB - 30 days (Direct Data)', variation_amount: '14999.91' },
    { variation_code: '19999.91', name: '100GB - 30 days (Direct Data)', variation_amount: '19999.91' },
    { variation_code: '29999.91', name: '160GB - 30 days (Direct Data)', variation_amount: '29999.91' },
    { variation_code: '39999.91', name: '210GB - 30 days (Direct Data)', variation_amount: '39999.91' },
    
    // Direct Data Plans (90-day duration)
    { variation_code: '49999.91', name: '300GB - 90 days (Direct Data)', variation_amount: '49999.91' },
    { variation_code: '59999.91', name: '350GB - 90 days (Direct Data)', variation_amount: '59999.91' }
  ],
  glo: [
    // SME Plans
    { variation_code: '8', name: '1 GB - 3 days (SME)', variation_amount: '1000.11' },
    { variation_code: '9', name: '3 GB - 3 days (SME)', variation_amount: '3000.11' },
    { variation_code: '10', name: '5 GB - 3 days (SME)', variation_amount: '5000.11' },
    { variation_code: '11', name: '1 GB - 7 days (SME)', variation_amount: '1000.12' },
    { variation_code: '12', name: '3 GB - 7 days (SME)', variation_amount: '3000.12' },
    { variation_code: '13', name: '5 GB - 7 days (SME)', variation_amount: '5000.12' },
    { variation_code: '14', name: '1 GB - 14 days (SME)', variation_amount: '1000.13' },
    { variation_code: '15', name: '3 GB - 14 days (SME)', variation_amount: '3000.13' },
    { variation_code: '16', name: '5 GB - 14 days (SME)', variation_amount: '5000.13' },
    { variation_code: '17', name: '10 GB - 14 days (SME)', variation_amount: '10000.13' },
    { variation_code: '18', name: '200 MB - 14 days (SME)', variation_amount: '200.13' },
    { variation_code: '19', name: '500 MB - 30 days (SME)', variation_amount: '500.13' },
    { variation_code: '20', name: '1 GB - 30 days (SME)', variation_amount: '1000.14' },
    { variation_code: '21', name: '2 GB - 30 days (SME)', variation_amount: '2000.13' },
    { variation_code: '22', name: '3 GB - 30 days (SME)', variation_amount: '3000.14' },
    { variation_code: '23', name: '5 GB - 30 days (SME)', variation_amount: '5000.14' },
    { variation_code: '24', name: '10 GB - 30 days (SME)', variation_amount: '10000.14' },
    
    // Awoof Data Plans
    { variation_code: '25', name: '125MB - 1 day (Awoof Data)', variation_amount: '125.01' },
    { variation_code: '26', name: '260MB - 2 days (Awoof Data)', variation_amount: '260.01' },
    { variation_code: '27', name: '2 GB - 1 day (Awoof Data)', variation_amount: '2000.01' },
    { variation_code: '28', name: '6 GB - 7 days (Awoof Data)', variation_amount: '6000.01' },
    
    // Direct Data Plans
    { variation_code: '29', name: '1.5GB - 14 days (Direct Data)', variation_amount: '1500.01' },
    { variation_code: '30', name: '2.6GB - 30 days (Direct Data)', variation_amount: '2600.01' },
    { variation_code: '31', name: '5GB - 30 days (Direct Data)', variation_amount: '5000.15' },
    { variation_code: '32', name: '6.15GB - 30 days (Direct Data)', variation_amount: '6150.01' },
    { variation_code: '33', name: '7.5GB - 30 days (Direct Data)', variation_amount: '7500.01' },
    { variation_code: '34', name: '10GB - 30 days (Direct Data)', variation_amount: '10000.15' },
    { variation_code: '35', name: '12.5GB - 30 days (Direct Data)', variation_amount: '12500.01' },
    { variation_code: '36', name: '16GB - 30 days (Direct Data)', variation_amount: '16000.01' },
    { variation_code: '37', name: '28GB - 30 days (Direct Data)', variation_amount: '28000.01' },
    { variation_code: '38', name: '38GB - 30 days (Direct Data)', variation_amount: '38000.01' },
    { variation_code: '39', name: '64GB - 30 days (Direct Data)', variation_amount: '64000.01' },
    { variation_code: '40', name: '107GB - 30 days (Direct Data)', variation_amount: '107000.01' },
    { variation_code: '41', name: '165GB - 30 days (Direct Data)', variation_amount: '165000.01' },
    { variation_code: '42', name: '220GB - 30 days (Direct Data)', variation_amount: '220000.01' },
    { variation_code: '43', name: '320GB - 30 days (Direct Data)', variation_amount: '320000.01' },
    { variation_code: '44', name: '380GB - 30 days (Direct Data)', variation_amount: '380000.01' },
    { variation_code: '45', name: '475GB - 30 days (Direct Data)', variation_amount: '475000.01' },
    
    // Weekend Plans
    { variation_code: '46', name: '2.5GB - Weekend Plan (Sat & Sun)', variation_amount: '2500.15' },
    { variation_code: '47', name: '875MB - Weekend Plan (Sun)', variation_amount: '875.01' }
  ],
  '9mobile': [
    // Awoof Data Plans
    { variation_code: '100.01', name: '100MB - 1 day (Awoof Data)', variation_amount: '100.01' },
    { variation_code: '150.01', name: '180MB - 1 day (Awoof Data)', variation_amount: '150.01' },
    { variation_code: '200.01', name: '250MB - 1 day (Awoof Data)', variation_amount: '200.01' },
    { variation_code: '350.01', name: '450MB - 1 day (Awoof Data)', variation_amount: '350.01' },
    { variation_code: '500.01', name: '650MB - 3 days (Awoof Data)', variation_amount: '500.01' },
    
    // Direct Data Plans
    { variation_code: '1500.01', name: '1.75GB - 7 days (Direct Data)', variation_amount: '1500.01' },
    { variation_code: '600.01', name: '650MB - 14 days (Direct Data)', variation_amount: '600.01' },
    { variation_code: '1000.01', name: '1.1GB - 30 days (Direct Data)', variation_amount: '1000.01' },
    { variation_code: '1200.01', name: '1.4GB - 30 days (Direct Data)', variation_amount: '1200.01' },
    { variation_code: '2000.01', name: '2.44GB - 30 days (Direct Data)', variation_amount: '2000.01' },
    { variation_code: '2500.01', name: '3.17GB - 30 days (Direct Data)', variation_amount: '2500.01' },
    { variation_code: '3000.01', name: '3.91GB - 30 days (Direct Data)', variation_amount: '3000.01' },
    { variation_code: '4000.01', name: '5.10GB - 30 days (Direct Data)', variation_amount: '4000.01' },
    { variation_code: '5000.01', name: '6.5GB - 30 days (Direct Data)', variation_amount: '5000.01' },
    { variation_code: '12000.01', name: '16GB - 30 days (Direct Data)', variation_amount: '12000.01' },
    { variation_code: '18500.01', name: '24.3GB - 30 days (Direct Data)', variation_amount: '18500.01' },
    { variation_code: '20000.01', name: '26.5GB - 30 days (Direct Data)', variation_amount: '20000.01' },
    { variation_code: '30000.01', name: '39GB - 60 days (Direct Data)', variation_amount: '30000.01' },
    { variation_code: '60000.01', name: '78GB - 90 days (Direct Data)', variation_amount: '60000.01' },
    { variation_code: '150000.01', name: '190GB - 180 days (Direct Data)', variation_amount: '150000.01' }
  ]
}

// Real ClubKonnect TV subscription plans from API documentation
const CLUBKONNECT_TV_PLANS = {
  dstv: [
    // Basic Plans
    { variation_code: 'dstv-padi', name: 'DStv Padi', variation_amount: '4400' },
    { variation_code: 'dstv-yanga', name: 'DStv Yanga', variation_amount: '6000' },
    { variation_code: 'dstv-confam', name: 'DStv Confam', variation_amount: '11000' },
    { variation_code: 'dstv79', name: 'DStv Compact', variation_amount: '19000' },
    { variation_code: 'dstv3', name: 'DStv Premium', variation_amount: '44500' },
    { variation_code: 'dstv7', name: 'DStv Compact Plus', variation_amount: '30000' },
    { variation_code: 'dstv9', name: 'DStv Premium-French', variation_amount: '69000' },
    { variation_code: 'dstv10', name: 'DStv Premium-Asia', variation_amount: '50500' },
    
    // ExtraView Plans
    { variation_code: 'confam-extra', name: 'DStv Confam + ExtraView', variation_amount: '17000' },
    { variation_code: 'yanga-extra', name: 'DStv Yanga + ExtraView', variation_amount: '12000' },
    { variation_code: 'padi-extra', name: 'DStv Padi + ExtraView', variation_amount: '10400' },
    { variation_code: 'dstv30', name: 'DStv Compact + Extra View', variation_amount: '25000' },
    { variation_code: 'dstv33', name: 'DStv Premium + Extra View', variation_amount: '50500' },
    { variation_code: 'dstv45', name: 'DStv Compact Plus + Extra View', variation_amount: '36000' },
    
    // French Touch Plans
    { variation_code: 'com-frenchtouch', name: 'DStv Compact + French Touch', variation_amount: '26000' },
    { variation_code: 'com-frenchtouch-extra', name: 'DStv Compact + French Touch + ExtraView', variation_amount: '32000' },
    { variation_code: 'complus-frenchtouch', name: 'DStv Compact Plus + French Touch', variation_amount: '37000' },
    { variation_code: 'dstv43', name: 'DStv Compact Plus + French Plus', variation_amount: '54500' },
    { variation_code: 'complus-french-extraview', name: 'DStv Compact Plus + FrenchPlus + Extra View', variation_amount: '60500' },
    { variation_code: 'dstv47', name: 'DStv Compact + French Plus', variation_amount: '43500' },
    { variation_code: 'dstv62', name: 'DStv Premium + French + Extra View', variation_amount: '75000' },
    
    // Add-ons
    { variation_code: 'frenchplus-addon', name: 'DStv French Plus Add-on', variation_amount: '24500' },
    { variation_code: 'frenchtouch-addon', name: 'DStv French Touch Add-on', variation_amount: '7000' },
    { variation_code: 'extraview-access', name: 'ExtraView Access', variation_amount: '6000' },
    
    // Showmax Plans
    { variation_code: 'dstv-yanga-showmax', name: 'DStv Yanga + Showmax', variation_amount: '7750' },
    { variation_code: 'dstv-confam-showmax', name: 'Dstv Confam + Showmax', variation_amount: '12750' },
    { variation_code: 'dstv-compact-showmax', name: 'DStv Compact + Showmax', variation_amount: '20750' },
    { variation_code: 'dstv-compact-plus-showmax', name: 'DStv Compact Plus + Showmax', variation_amount: '31750' },
    { variation_code: 'dstv-premium-showmax', name: 'DStv Premium + Showmax', variation_amount: '44500' },
    { variation_code: 'dstv-premium-french-showmax', name: 'DStv Premium + French + Showmax', variation_amount: '69000' },
    
    // Special Plans
    { variation_code: 'dstv-greatwall', name: 'DStv Great Wall Standalone Bouquet', variation_amount: '3800' },
    { variation_code: 'dstv-greatwall-showmax', name: 'DStv Great Wall Standalone Bouquet + Showmax', variation_amount: '7300' },
    { variation_code: 'dstv-indian', name: 'DStv Indian', variation_amount: '14900' },
    { variation_code: 'dstv-premium-indian', name: 'DStv Premium East Africa and Indian', variation_amount: '16530' },
    { variation_code: 'dstv-fta-plus', name: 'DStv FTA Plus', variation_amount: '1600' },
    { variation_code: 'dstv-premium-hd', name: 'DStv PREMIUM HD', variation_amount: '39000' },
    { variation_code: 'dstv-access-1', name: 'DStv Access', variation_amount: '2000' },
    { variation_code: 'dstv-mobile-1', name: 'DSTV MOBILE', variation_amount: '790' },
    { variation_code: 'dstv-movie-bundle-add-on', name: 'DStv Movie Bundle Add-on', variation_amount: '3500' },
    { variation_code: 'dstv-pvr-access', name: 'DStv PVR Access Service', variation_amount: '4000' }
  ],
  gotv: [
    { variation_code: 'gotv-max', name: 'GOtv Max', variation_amount: '8500' },
    { variation_code: 'gotv-jolli', name: 'GOtv Jolli', variation_amount: '5800' },
    { variation_code: 'gotv-jinja', name: 'GOtv Jinja', variation_amount: '3900' },
    { variation_code: 'gotv-smallie', name: 'GOtv Smallie - monthly', variation_amount: '1900' },
    { variation_code: 'gotv-smallie-3months', name: 'GOtv Smallie - quarterly', variation_amount: '5100' },
    { variation_code: 'gotv-smallie-1year', name: 'GOtv Smallie - yearly', variation_amount: '15000' },
    { variation_code: 'gotv-supa', name: 'GOtv Supa - monthly', variation_amount: '11400' },
    { variation_code: 'gotv-supa-plus', name: 'GOtv Supa Plus - monthly', variation_amount: '16800' }
  ],
  startimes: [
    // Monthly Plans
    { variation_code: 'nova', name: 'Nova (Dish) - 1 Month', variation_amount: '2100' },
    { variation_code: 'basic', name: 'Basic (Antenna) - 1 Month', variation_amount: '4000' },
    { variation_code: 'smart', name: 'Basic (Dish) - 1 Month', variation_amount: '5100' },
    { variation_code: 'classic', name: 'Classic (Antenna) - 1 Month', variation_amount: '6000' },
    { variation_code: 'super', name: 'Super (Dish) - 1 Month', variation_amount: '9800' },
    
    // Weekly Plans
    { variation_code: 'nova-weekly', name: 'Nova (Antenna) - 1 Week', variation_amount: '700' },
    { variation_code: 'basic-weekly', name: 'Basic (Antenna) - 1 Week', variation_amount: '1400' },
    { variation_code: 'smart-weekly', name: 'Basic (Dish) - 1 Week', variation_amount: '1700' },
    { variation_code: 'classic-weekly', name: 'Classic (Antenna) - 1 Week', variation_amount: '2000' },
    { variation_code: 'super-weekly', name: 'Super (Dish) - 1 Week', variation_amount: '3200' },
    
    // Special Plans
    { variation_code: 'uni-1', name: 'Chinese (Dish) - 1 month', variation_amount: '21000' },
    { variation_code: 'uni-2', name: 'Chinese (Dish) - 1 month', variation_amount: '21000' },
    { variation_code: 'special-weekly', name: 'Special (Dish) - 1 Week', variation_amount: '3500' },
    { variation_code: 'special-monthly', name: 'Special (Dish) - 1 Month', variation_amount: '14000' },
    
    // Dish Plans
    { variation_code: 'nova-dish-weekly', name: 'Nova (Dish) - 1 Week', variation_amount: '700' },
    { variation_code: 'super-antenna-weekly', name: 'Super (Antenna) - 1 Week', variation_amount: '3200' },
    { variation_code: 'super-antenna-monthly', name: 'Super (Antenna) - 1 Month', variation_amount: '9800' },
    { variation_code: 'classic-weekly-dish', name: 'Classic (Dish) - 1 Week', variation_amount: '2000' },
    { variation_code: 'global-monthly-dish', name: 'Global (Dish) - 1 Month', variation_amount: '14000' },
    { variation_code: 'global-weekly-dish', name: 'Global (Dish) - 1 Week', variation_amount: '3500' },
    
    // SHS Plans
    { variation_code: 'shs-weekly-2800', name: 'Startimes SHS - Weekly', variation_amount: '2800' },
    { variation_code: 'shs-weekly-4620', name: 'Startimes SHS - Weekly', variation_amount: '4620' },
    { variation_code: 'shs-weekly-4900', name: 'Startimes SHS - Weekly', variation_amount: '4900' },
    { variation_code: 'shs-weekly-9100', name: 'Startimes SHS - Weekly', variation_amount: '9100' },
    { variation_code: 'shs-monthly-12000', name: 'Startimes SHS - Monthly', variation_amount: '12000' },
    { variation_code: 'shs-monthly-19800', name: 'Startimes SHS - Monthly', variation_amount: '19800' },
    { variation_code: 'shs-monthly-21000', name: 'Startimes SHS - Monthly', variation_amount: '21000' },
    { variation_code: 'shs-monthly-39000', name: 'Startimes SHS - Monthly', variation_amount: '39000' }
  ]
}

// Handle GET requests (for data plans, TV plans, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const network = searchParams.get('network')
    const provider = searchParams.get('provider')

    switch (action) {
      case 'data-plans':
        if (!network) {
          return NextResponse.json({ success: false, error: 'Network parameter required' }, { status: 400 })
        }
        
        const dataPlans = CLUBKONNECT_DATA_PLANS[network as keyof typeof CLUBKONNECT_DATA_PLANS] || []
        return NextResponse.json({
          success: true,
          content: {
            variations: dataPlans
          }
        })

      case 'tv-plans':
        if (!provider) {
          return NextResponse.json({ success: false, error: 'Provider parameter required' }, { status: 400 })
        }
        
        const tvPlans = CLUBKONNECT_TV_PLANS[provider as keyof typeof CLUBKONNECT_TV_PLANS] || []
        return NextResponse.json({
          success: true,
          content: {
            variations: tvPlans
          }
        })

      case 'providers':
        return NextResponse.json({
          success: true,
          content: {
            servicevariations: [
              { serviceID: 'mtn', name: 'MTN' },
              { serviceID: 'airtel', name: 'Airtel' },
              { serviceID: 'glo', name: 'GLO' },
              { serviceID: '9mobile', name: '9mobile' }
            ]
          }
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('API GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle POST requests (for purchases)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    let result: any

    switch (action) {
      case 'airtime':
        const { phone, amount, serviceID: airtimeServiceID } = data
        if (!phone || !amount || !airtimeServiceID) {
          logger.warn('Missing required fields for airtime purchase', { phone, amount, serviceID: airtimeServiceID })
          return NextResponse.json(
            { success: false, error: 'Missing required fields for airtime purchase' },
            { status: 400 }
          )
        }

        logger.info('Processing airtime purchase', { phone, amount, serviceID: airtimeServiceID })

        result = await clubKonnectService.purchaseAirtime(
          airtimeServiceID,
          parseFloat(amount),
          phone,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )

        // Interpret ClubKonnect response; surface real failure instead of always success
        const status = (result?.status || '').toUpperCase()
        const statusCode = (result as any)?.statuscode

        const isAccepted = status === 'ORDER_RECEIVED' || status === 'ORDER_COMPLETED' || statusCode === '100' || statusCode === '200'

        if (!isAccepted) {
          const errorStatus = status || 'UNKNOWN_ERROR'
          const userFriendlyMessage = getUserFriendlyMessage(errorStatus, result?.message)
          
          logger.error('Airtime purchase failed', { 
            phone, 
            amount, 
            serviceID: airtimeServiceID, 
            errorStatus, 
            clubKonnectResponse: result 
          })
          
          return NextResponse.json(
            {
              success: false,
              error: userFriendlyMessage,
              errorCode: errorStatus,
              data: result,
            },
            { status: 400 }
          )
        }

        logger.info('Airtime purchase successful', { phone, amount, serviceID: airtimeServiceID, status })

        return NextResponse.json({
          success: true,
          data: result,
          message: 'Airtime purchase initiated successfully'
        })

      case 'data':
        // Handle both field naming conventions
        const dataPhone = data.phoneNumber || data.phone
        const variationCode = data.dataPlan || data.variationCode
        const dataServiceID = data.network || data.serviceID
        const dataAmount = data.amount
        if (!dataPhone || !variationCode || !dataServiceID) {
          logger.warn('Missing required fields for data purchase', { phone: dataPhone, variationCode, serviceID: dataServiceID })
          return NextResponse.json(
            { success: false, error: 'Missing required fields for data purchase' },
            { status: 400 }
          )
        }

        logger.info('Processing data purchase', { phone: dataPhone, variationCode, serviceID: dataServiceID })

        // Simple approach: use variationCode as the amount for ClubKonnect
        result = await clubKonnectService.purchaseData(
          dataServiceID.replace('-data', ''),
          variationCode,
          dataPhone,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )

        // Check ClubKonnect response status for data purchase
        const dataStatus = (result?.status || '').toUpperCase()
        const dataStatusCode = (result as any)?.statuscode
        const isDataAccepted = dataStatus === 'ORDER_RECEIVED' || dataStatus === 'ORDER_COMPLETED' || dataStatusCode === '100' || dataStatusCode === '200'

        if (!isDataAccepted) {
          const errorStatus = dataStatus || 'UNKNOWN_ERROR'
          const userFriendlyMessage = getUserFriendlyMessage(errorStatus, result?.message)
          
          logger.error('Data purchase failed', { 
            phone: dataPhone, 
            variationCode, 
            serviceID: dataServiceID, 
            errorStatus, 
            clubKonnectResponse: result 
          })
          
          return NextResponse.json(
            {
              success: false,
              error: userFriendlyMessage,
              errorCode: errorStatus,
              data: result,
            },
            { status: 400 }
          )
        }

        logger.info('Data purchase successful', { phone: dataPhone, variationCode, serviceID: dataServiceID, status: dataStatus })

        return NextResponse.json({
          success: true,
          data: result,
          message: 'Data purchase initiated successfully'
        })

      case 'electricity':
        // Handle both field naming conventions
        const elecCustomer = data.meterNumber || data.customer
        const elecAmount = data.amount
        const elecServiceID = data.disco || data.serviceID
        if (!elecCustomer || !elecAmount || !elecServiceID) {
          logger.warn('Missing required fields for electricity purchase', { customer: elecCustomer, amount: elecAmount, serviceID: elecServiceID })
          return NextResponse.json(
            { success: false, error: 'Missing required fields for electricity purchase' },
            { status: 400 }
          )
        }

        result = await clubKonnectService.payElectricity(
          elecServiceID.replace('-electric', ''),
          elecCustomer,
          parseFloat(elecAmount),
          elecCustomer,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )

        // Check ClubKonnect response status for electricity payment
        const elecStatus = (result?.status || '').toUpperCase()
        const elecStatusCode = (result as any)?.statuscode
        const isElecAccepted = elecStatus === 'ORDER_RECEIVED' || elecStatus === 'ORDER_COMPLETED' || elecStatusCode === '100' || elecStatusCode === '200'

        if (!isElecAccepted) {
          const errorStatus = elecStatus || 'UNKNOWN_ERROR'
          const userFriendlyMessage = getUserFriendlyMessage(errorStatus, result?.message)
          
          return NextResponse.json(
            {
              success: false,
              error: userFriendlyMessage,
              errorCode: errorStatus,
              data: result,
            },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: result,
          message: 'Electricity payment initiated successfully'
        })

      case 'tv':
        // Handle both field naming conventions
        const tvCustomer = data.customer
        const tvVariationCode = data.variationCode
        const tvServiceID = data.serviceID
        if (!tvCustomer || !tvVariationCode || !tvServiceID) {
          logger.warn('Missing required fields for TV subscription', { customer: tvCustomer, variationCode: tvVariationCode, serviceID: tvServiceID })
          return NextResponse.json(
            { success: false, error: 'Missing required fields for TV subscription' },
            { status: 400 }
          )
        }

        result = await clubKonnectService.purchaseTVSubscription(
          tvServiceID,
          tvVariationCode,
          tvCustomer,
          tvCustomer,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )

        // Check ClubKonnect response status for TV subscription
        const tvStatus = (result?.status || '').toUpperCase()
        const tvStatusCode = (result as any)?.statuscode
        const isTvAccepted = tvStatus === 'ORDER_RECEIVED' || tvStatus === 'ORDER_COMPLETED' || tvStatusCode === '100' || tvStatusCode === '200'

        if (!isTvAccepted) {
          const errorStatus = tvStatus || 'UNKNOWN_ERROR'
          const userFriendlyMessage = getUserFriendlyMessage(errorStatus, result?.message)
          
          return NextResponse.json(
            {
              success: false,
              error: userFriendlyMessage,
              errorCode: errorStatus,
              data: result,
            },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: result,
          message: 'TV subscription initiated successfully'
        })

      case 'status':
        const { orderId, requestId } = data
        if (!orderId && !requestId) {
          return NextResponse.json(
            { success: false, error: 'Either orderId or requestId is required' },
            { status: 400 }
          )
        }

        result = await clubKonnectService.queryTransaction(orderId, requestId)
        return NextResponse.json({
          success: true,
          data: result
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('API POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}