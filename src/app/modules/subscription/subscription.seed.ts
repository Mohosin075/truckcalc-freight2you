import { SubscriptionPlan } from './subscription-plan.model'
import { stripeService } from './stripe.service'

// Default subscription plans for TruckCalc
const defaultPlans = [
  {
    name: 'Free Trial',
    description: 'Get started with basic features',
    price: 0,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 7,
    features: [
      '10 calculations/day',
      'Basic history',
      'CSV export',
    ],
    maxTeamMembers: 1,
    maxServices: 10,
    userTypes: ['user'],
    priority: 1,
  },
  {
    name: 'Pro',
    description: 'Full access for professional truckers',
    price: 9.99,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 0,
    features: [
      'Unlimited calculations',
      'Full history',
      'PDF & CSV export',
      'Priority support',
      'Save over 50% compared to monthly',
    ],
    maxTeamMembers: 1,
    maxServices: 999999,
    userTypes: ['user'],
    priority: 2,
  },
  {
    name: 'Annual',
    description: 'Best value for long-term planning',
    price: 79.99,
    currency: 'usd',
    interval: 'year' as const,
    intervalCount: 1,
    trialPeriodDays: 0,
    features: [
      'Unlimited calculations',
      'Full history',
      'PDF & CSV export',
      'Priority support',
      'Save over 50% compared to monthly',
    ],
    maxTeamMembers: 1,
    maxServices: 999999,
    userTypes: ['user'],
    priority: 3,
  },
]

export async function seedSubscriptionPlans(): Promise<void> {
  try {
    console.log('Starting subscription plans seeding...')

    // Check if plans already exist
    const existingPlansCount = await SubscriptionPlan.countDocuments()
    if (existingPlansCount > 0) {
      console.log(`${existingPlansCount} subscription plans already exist. Updating prices in database...`)
      await SubscriptionPlan.updateOne({ name: 'Pro' }, { $set: { price: 9.99 } })
      await SubscriptionPlan.updateOne({ name: 'Annual' }, { $set: { price: 79.99 } })
      console.log('Database subscription plan prices updated successfully.')
      return
    }

    // Create plans in Stripe and database
    for (const planData of defaultPlans) {
      try {
        // Create Stripe product
        const stripeProduct = await stripeService.createProduct({
          name: planData.name,
          description: planData.description,
          metadata: {
            userTypes: planData.userTypes.join(','),
            maxTeamMembers: planData.maxTeamMembers.toString(),
            maxServices: planData.maxServices.toString(),
          },
        })

        // Create Stripe price
        const stripePrice = await stripeService.createPrice({
          productId: stripeProduct.id,
          unitAmount: Math.round(planData.price * 100), // Convert to cents
          currency: planData.currency,
          interval: planData.interval,
          intervalCount: planData.intervalCount,
          metadata: {
            planName: planData.name,
          },
        })

        // Create local plan
        const plan = new SubscriptionPlan({
          ...planData,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          isActive: true,
        })

        await plan.save()
        console.log(`Created subscription plan: ${planData.name}`)
      } catch (error) {
        console.error(`Error creating plan ${planData.name}:`, error)
        // Continue with other plans even if one fails
      }
    }

    console.log('Subscription plans seeding completed successfully')
  } catch (error) {
    console.error('Error seeding subscription plans:', error)
    throw error
  }
}

// Function to update existing plans (for migrations)
export async function updateSubscriptionPlans(): Promise<void> {
  try {
    console.log('Updating subscription plans...')

    // Add any plan updates here
    // Example: Update features for existing plans
    
    console.log('Subscription plans update completed')
  } catch (error) {
    console.error('Error updating subscription plans:', error)
    throw error
  }
}

// Function to create a specific plan (for testing or manual creation)
export async function createSpecificPlan(planData: any): Promise<void> {
  try {
    // Create Stripe product
    const stripeProduct = await stripeService.createProduct({
      name: planData.name,
      description: planData.description,
      metadata: planData.metadata || {},
    })

    // Create Stripe price
    const stripePrice = await stripeService.createPrice({
      productId: stripeProduct.id,
      unitAmount: Math.round(planData.price * 100),
      currency: planData.currency,
      interval: planData.interval,
      intervalCount: planData.intervalCount || 1,
    })

    // Create local plan
    const plan = new SubscriptionPlan({
      ...planData,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    })

    await plan.save()
    console.log(`Created specific plan: ${planData.name}`)
  } catch (error) {
    console.error(`Error creating specific plan:`, error)
    throw error
  }
}
