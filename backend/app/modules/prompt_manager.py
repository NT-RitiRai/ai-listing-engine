from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Prompt

class PromptManager:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_prompts(self) -> list[Prompt]:
        result = await self.db.execute(select(Prompt))
        return list(result.scalars().all())

    async def create_prompt(self, data: dict) -> Prompt:
        prompt = Prompt(**data)
        self.db.add(prompt)
        await self.db.commit()
        await self.db.refresh(prompt)
        return prompt

    async def get_prompt_by_id(self, prompt_id: str) -> Prompt | None:
        return await self.db.get(Prompt, prompt_id)
