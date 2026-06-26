package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.response.BatchTagResponse;
import vn.pawstag.dto.response.TagResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.enums.TagType;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.repository.TagRepository;
import vn.pawstag.service.TagService;
import vn.pawstag.util.CodeGenerator;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final CodeGenerator codeGenerator;

    public TagServiceImpl(TagRepository tagRepository,
                          PetRepository petRepository,
                          OwnerRepository ownerRepository,
                          CodeGenerator codeGenerator) {
        this.tagRepository = tagRepository;
        this.petRepository = petRepository;
        this.ownerRepository = ownerRepository;
        this.codeGenerator = codeGenerator;
    }

    @Override
    @Transactional
    public void createForPet(Pet pet) {
        Tag tag = Tag.builder()
                .publicCode(codeGenerator.uniquePublicCode())
                .pet(pet)
                .status(TagStatus.ACTIVE)
                .type(TagType.QR)
                .nfcLinked(false)
                .activatedAt(Instant.now())
                .build();
        tagRepository.save(tag);
    }

    @Override
    @Transactional
    public void releaseTagsForPet(Pet pet) {
        List<Tag> tags = tagRepository.findByPetId(pet.getId());
        for (Tag t : tags) {
            t.setPet(null);
            t.setStatus(TagStatus.UNASSIGNED);
            t.setNfcLinked(false);
            t.setActivatedAt(null);
        }
        tagRepository.saveAll(tags);
    }

    @Override
    @Transactional
    public BatchTagResponse generateBatch(int quantity) {
        List<String> codes = new ArrayList<>(quantity);
        List<Tag> tags = new ArrayList<>(quantity);
        for (int i = 0; i < quantity; i++) {
            String code = codeGenerator.uniquePublicCode();
            codes.add(code);
            tags.add(Tag.builder()
                    .publicCode(code)
                    .status(TagStatus.UNASSIGNED)
                    .type(TagType.QR)
                    .nfcLinked(false)
                    .build());
        }
        tagRepository.saveAll(tags);
        return new BatchTagResponse(codes.size(), codes);
    }

    @Override
    @Transactional
    public TagResponse activate(String ownerEmail, String publicCode, Long petId) {
        Owner owner = requireOwner(ownerEmail);
        Pet pet = petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found"));

        Tag tag = tagRepository.findByPublicCode(publicCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Tag code not found"));

        if (tag.getStatus() == TagStatus.ACTIVE && tag.getPet() != null) {
            throw new BadRequestException("Tag already assigned to a pet");
        }

        tag.setPet(pet);
        tag.setStatus(TagStatus.ACTIVE);
        tag.setActivatedAt(Instant.now());
        return TagResponse.from(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public TagResponse markNfc(String ownerEmail, Long tagId, boolean enabled) {
        Owner owner = requireOwner(ownerEmail);
        Tag tag = tagRepository.findByIdAndPet_Owner_Id(tagId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        tag.setNfcLinked(enabled);
        tag.setType(enabled ? TagType.NFC : TagType.QR);
        return TagResponse.from(tagRepository.save(tag));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> listMine(String ownerEmail) {
        Owner owner = requireOwner(ownerEmail);
        return tagRepository.findByPet_Owner_IdOrderByCreatedAtDesc(owner.getId())
                .stream().map(TagResponse::from).toList();
    }

    private Owner requireOwner(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }
}
