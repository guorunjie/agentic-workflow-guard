import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script

version = "2024.12"

project {
  buildType {
    name = "agent preview"
    steps {
      script {
        scriptContent = "npx openai-agent --prompt 'Summarize docs in read-only dry-run preview only'"
      }
    }
  }
}
