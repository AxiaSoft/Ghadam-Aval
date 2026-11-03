import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { disposeSceneResources } from '../assets/AssetManager';
import { AtmosphereField } from './AtmosphereField';
import { ColdWorldAndTransformScene } from './ColdWorldAndTransformScene';
import { MissionPathScene } from './MissionPathScene';
import { MissionObjectScene } from './MissionObjectScene';
import { MissionUniversityScene } from './MissionUniversityScene';
import { ClassroomScene } from './ClassroomScene';
import { LobbyAndEndingScene } from './LobbyAndEndingScene';

type ActiveEnvironmentKey =
  | 'cold_and_transform'
  | 'mission_1_path'
  | 'mission_2_object'
  | 'mission_3_university'
  | 'classroom'
  | 'lobby_and_ending';

export const SceneManager: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const envGroupRef = useRef<THREE.Group>(null);

  let envKey: ActiveEnvironmentKey = 'cold_and_transform';
  switch (stage) {
    case 'INTRO':
    case 'QUESTIONNAIRE':
    case 'RELATIONSHIP_QUESTION':
    case 'RESPECTFUL_ENDING':
    case 'WORLD_TRANSFORMATION':
      envKey = 'cold_and_transform';
      break;
    case 'MISSION_1':
      envKey = 'mission_1_path';
      break;
    case 'MISSION_2':
      envKey = 'mission_2_object';
      break;
    case 'MISSION_3':
      envKey = 'mission_3_university';
      break;
    case 'CLASSROOM_ENTRY':
    case 'CLASSROOM_GAMEPLAY':
    case 'CLASSROOM_CINEMATIC':
      envKey = 'classroom';
      break;
    case 'LOBBY_ENTRY':
    case 'LOBBY_CINEMATIC':
    case 'FINAL_DECISION':
    case 'DIALOGUE':
    case 'FINAL_ENDING':
      envKey = 'lobby_and_ending';
      break;
  }

  useEffect(() => {
    const currentGroup = envGroupRef.current;
    return () => {
      disposeSceneResources(currentGroup);
    };
  }, [envKey]);

  return (
    <group ref={envGroupRef} key={envKey}>
      <AtmosphereField />
      {envKey === 'cold_and_transform' && <ColdWorldAndTransformScene />}
      {envKey === 'mission_1_path' && <MissionPathScene />}
      {envKey === 'mission_2_object' && <MissionObjectScene />}
      {envKey === 'mission_3_university' && <MissionUniversityScene />}
      {envKey === 'classroom' && <ClassroomScene />}
      {envKey === 'lobby_and_ending' && <LobbyAndEndingScene />}
    </group>
  );
};
