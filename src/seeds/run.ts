import { db } from '../db/index.js'
import { templates, templateStages } from '../db/index.js'
import { defaultTemplates } from './default-templates.js'

async function seed() {
  console.log('🌱 Seeding default templates...')
  for (const t of defaultTemplates) {
    const [template] = await db.insert(templates).values({
      name: t.name,
      industry: t.industry,
      description: t.description,
      workspaceId: undefined,
    }).returning()

    await db.insert(templateStages).values(
      t.stages.map(s => ({ ...s, templateId: template.id }))
    )
    console.log(`  ✓ ${t.name}`)
  }
  console.log('✅ Seeding complete')
  process.exit(0)
}

seed().catch(console.error)
